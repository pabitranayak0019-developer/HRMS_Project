const ExpenseClaim = require('../models/ExpenseClaim');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { EXPENSE_STATUS, ROLES, EXPENSE_CATEGORIES } = require('../config/constants');
const { createNotification, notifyMany, notifyAdmins } = require('../services/notificationService');

const submitExpense = asyncHandler(async (req, res, next) => {
  const { title, category, amount, expenseDate, description } = req.body;
  if (!title || !category || !amount || !expenseDate) return next(new AppError('Title, category, amount and date are required.', 400));
  if (!EXPENSE_CATEGORIES.includes(category)) return next(new AppError('Invalid expense category.', 400));
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) return next(new AppError('Amount must be a positive number.', 400));

  const claim = await ExpenseClaim.create({
    user: req.user._id,
    title,
    category,
    amount: amt,
    expenseDate,
    description: description || '',
    receiptFile: req.file ? req.file.path.replace(/\\/g, '/') : '',
    status: EXPENSE_STATUS.PENDING,
  });

  await createNotification({
    recipient: req.user._id,
    type: 'EXPENSE_SUBMITTED',
    title: 'Expense claim submitted',
    message: `${title} of ₹${amt.toLocaleString('en-IN')} is pending approval.`,
    link: '/expenses',
  });

  if (req.user.manager) {
    await createNotification({
      recipient: req.user.manager,
      type: 'EXPENSE_SUBMITTED',
      title: 'New expense claim',
      message: `${req.user.firstName} ${req.user.lastName} submitted ${title} for ₹${amt.toLocaleString('en-IN')}.`,
      link: '/manager/expenses',
    });
  } else {
    await notifyAdmins({
      type: 'EXPENSE_SUBMITTED',
      title: 'New expense claim',
      message: `${req.user.firstName} ${req.user.lastName} submitted ${title} for ₹${amt.toLocaleString('en-IN')}.`,
      link: '/admin/expenses',
    });
  }

  res.status(201).json({ success: true, message: 'Expense claim submitted.', data: claim });
});

const myExpenses = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 10);
  const data = await ExpenseClaim.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum);
  const total = await ExpenseClaim.countDocuments(query);
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const listForApproval = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id');
    query.user = { $in: team.map((t) => t._id) };
  }
  const data = await ExpenseClaim.find(query)
    .populate('user', 'firstName lastName employeeId email')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, data });
});

const allExpenses = asyncHandler(async (req, res) => {
  const { status, userId, page = 1, limit = 15 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (userId) query.user = userId;
  if (req.user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id');
    query.user = { $in: team.map((t) => t._id) };
  }
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 15);
  const data = await ExpenseClaim.find(query)
    .populate('user', 'firstName lastName employeeId')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await ExpenseClaim.countDocuments(query);
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const reviewExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action, comment, approvedAmount } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(action)) return next(new AppError('Action must be APPROVED or REJECTED.', 400));
  const claim = await ExpenseClaim.findById(id).populate('user', 'firstName lastName email manager');
  if (!claim) return next(new AppError('Expense claim not found.', 404));

  const isManagerAllowed = req.user.role === ROLES.MANAGER && String(claim.user.manager || '') === String(req.user._id);
  const isAdminAllowed = req.user.role === ROLES.HR_ADMIN;
  if (!isManagerAllowed && !isAdminAllowed) return next(new AppError('You are not authorized to review this claim.', 403));
  if (claim.status !== EXPENSE_STATUS.PENDING) return next(new AppError('This claim has already been reviewed.', 400));

  claim.status = action;
  claim.approver = req.user._id;
  claim.approvalComment = comment || '';
  if (action === 'APPROVED') {
    claim.approvedAmount = Number(approvedAmount) || claim.amount;
    claim.reimbursedDate = new Date();
  }
  await claim.save();

  await createNotification({
    recipient: claim.user._id,
    type: action === 'APPROVED' ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
    title: action === 'APPROVED' ? 'Expense approved' : 'Expense rejected',
    message: `Your claim "${claim.title}" (₹${claim.amount.toLocaleString('en-IN')}) was ${action.toLowerCase()}${comment ? ` — ${comment}` : ''}.`,
    link: '/expenses',
  });

  res.json({ success: true, message: `Expense ${action.toLowerCase()}.`, data: claim });
});

module.exports = { submitExpense, myExpenses, listForApproval, allExpenses, reviewExpense };
