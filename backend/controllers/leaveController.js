const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { LEAVE_STATUS, ROLES } = require('../config/constants');
const leaveService = require('../services/leaveService');
const { createNotification, notifyMany, notifyAdmins } = require('../services/notificationService');

const applyLeave = asyncHandler(async (req, res, next) => {
  const { leaveType, startDate, endDate, reason, duration } = req.body;
  if (!leaveType || !startDate || !endDate || !reason) {
    return next(new AppError('Leave type, dates and reason are required.', 400));
  }
  const actualDuration = leaveType === 'HALF_DAY' ? 'HALF_DAY' : duration === 'HALF_DAY' ? 'HALF_DAY' : 'FULL_DAY';

  try {
    leaveService.validateLeaveDates(startDate, endDate, actualDuration);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 400));
  }

  const days = leaveService.calcDays(startDate, endDate, actualDuration);

  const overlap = await leaveService.hasOverlap(req.user._id, startDate, endDate);
  if (overlap) return next(new AppError('You already have a pending/approved leave overlapping these dates.', 409));

  try {
    await leaveService.checkSufficientBalance(req.user._id, leaveType, days);
  } catch (err) {
    return next(new AppError(err.message, err.statusCode || 400));
  }

  const request = await LeaveRequest.create({
    user: req.user._id,
    leaveType,
    duration: actualDuration,
    startDate,
    endDate,
    numberOfDays: days,
    reason,
    status: LEAVE_STATUS.PENDING,
  });

  await createNotification({
    recipient: req.user._id,
    type: 'LEAVE_SUBMITTED',
    title: 'Leave request submitted',
    message: `Your ${leaveType.replace(/_/g, ' ').toLowerCase()} request for ${days} day(s) from ${new Date(startDate).toLocaleDateString('en-IN')} is pending approval.`,
    link: '/leaves',
  });

  const approver = req.user.manager;
  if (approver) {
    await createNotification({
      recipient: approver,
      type: 'LEAVE_SUBMITTED',
      title: 'New leave request',
      message: `${req.user.firstName} ${req.user.lastName} (${req.user.employeeId}) applied for ${days} day(s) ${leaveType.replace(/_/g, ' ').toLowerCase()}.`,
      link: '/manager/leave-approvals',
    });
  } else {
    await notifyAdmins({
      type: 'LEAVE_SUBMITTED',
      title: 'New leave request',
      message: `${req.user.firstName} ${req.user.lastName} (${req.user.employeeId}) applied for ${days} day(s).`,
      link: '/admin/leaves',
    });
  }

  res.status(201).json({ success: true, message: 'Leave request submitted.', data: request });
});

const myLeaves = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 10);
  const data = await LeaveRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await LeaveRequest.countDocuments(query);
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const myBalances = asyncHandler(async (req, res) => {
  const balances = await leaveService.getBalances(req.user._id);
  res.json({ success: true, data: balances });
});

const pendingApprovals = asyncHandler(async (req, res) => {
  const query = { status: LEAVE_STATUS.PENDING };
  if (req.user.role === 'MANAGER') {
    const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id');
    query.user = { $in: team.map((t) => t._id) };
  }
  const data = await LeaveRequest.find(query)
    .populate('user', 'firstName lastName email employeeId')
    .populate('user.manager')
    .sort({ createdAt: 1 })
    .limit(200);
  res.json({ success: true, data });
});

const allLeaves = asyncHandler(async (req, res) => {
  const { status, userId, page = 1, limit = 15 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (userId) query.user = userId;
  if (req.user.role === 'MANAGER') {
    const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id');
    query.user = { $in: team.map((t) => t._id) };
  }
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 15);
  const data = await LeaveRequest.find(query)
    .populate('user', 'firstName lastName email employeeId department')
    .populate('approver', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await LeaveRequest.countDocuments(query);
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const canReview = (reqUser, leave) => {
  if (reqUser.role === ROLES.HR_ADMIN) return true;
  if (reqUser.role === ROLES.MANAGER && leave.user && String(leave.user.manager || '') === String(reqUser._id)) return true;
  return false;
};

const reviewLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action, comment } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(action)) return next(new AppError('Action must be APPROVED or REJECTED.', 400));

  const leave = await LeaveRequest.findById(id).populate('user', 'firstName lastName employeeId email manager');
  if (!leave) return next(new AppError('Leave request not found.', 404));
  if (!canReview(req.user, leave)) return next(new AppError('You are not authorized to review this request.', 403));
  if (leave.status !== LEAVE_STATUS.PENDING) return next(new AppError('This request has already been reviewed.', 400));

  leave.status = action;
  leave.approver = req.user._id;
  leave.approvalComment = comment || '';
  await leave.save();

  await createNotification({
    recipient: leave.user._id,
    type: action === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    title: action === 'APPROVED' ? 'Leave approved' : 'Leave rejected',
    message: `Your ${leave.leaveType.replace(/_/g, ' ').toLowerCase()} request (${leave.numberOfDays} day(s)) was ${action.toLowerCase()}${comment ? ` — ${comment}` : ''}.`,
    link: '/leaves',
  });

  res.json({ success: true, message: `Leave ${action.toLowerCase()}.`, data: leave });
});

const cancelLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const leave = await LeaveRequest.findById(id);
  if (!leave) return next(new AppError('Leave request not found.', 404));
  if (String(leave.user) !== String(req.user._id) && req.user.role !== ROLES.HR_ADMIN) {
    return next(new AppError('You can only cancel your own requests.', 403));
  }
  if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED].includes(leave.status)) {
    return next(new AppError('Only pending or approved leaves can be cancelled.', 400));
  }
  leave.status = LEAVE_STATUS.CANCELLED;
  await leave.save();
  res.json({ success: true, message: 'Leave cancelled.' });
});

module.exports = { applyLeave, myLeaves, myBalances, pendingApprovals, allLeaves, reviewLeave, cancelLeave };
