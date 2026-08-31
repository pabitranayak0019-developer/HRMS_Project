const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { startOfDay, endOfDay, toISODate, getMonthRange, monthLabel } = require('../utils/dateUtils');
const { ATTENDANCE_STATUS } = require('../config/constants');
const attendanceService = require('../services/attendanceService');

const clockIn = asyncHandler(async (req, res, next) => {
  try {
    const record = await attendanceService.clockIn(req.user._id, new Date());
    res.status(201).json({
      success: true,
      message: record.isLate ? 'Clocked in (late).' : 'Clocked in successfully.',
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

const clockOut = asyncHandler(async (req, res, next) => {
  try {
    const record = await attendanceService.clockOut(req.user._id, new Date());
    res.json({
      success: true,
      message: 'Clocked out successfully.',
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

const todayStatus = asyncHandler(async (req, res) => {
  const record = await attendanceService.findToday(req.user._id, new Date());
  const leave = await LeaveRequest.findOne({
    user: req.user._id,
    status: 'APPROVED',
    startDate: { $lte: endOfDay(new Date()) },
    endDate: { $gte: startOfDay(new Date()) },
  });
  const holiday = await Holiday.findOne({ date: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) }, isActive: true });
  res.json({
    success: true,
    data: {
      date: toISODate(new Date()),
      attendance: record,
      onLeave: Boolean(leave),
      leave,
      isHoliday: Boolean(holiday),
      holiday,
      status: holiday ? ATTENDANCE_STATUS.HOLIDAY : leave ? ATTENDANCE_STATUS.ON_LEAVE : record ? record.status : ATTENDANCE_STATUS.ABSENT,
    },
  });
});

const monthView = async (userId, year, month) => {
  const { start, end } = getMonthRange(year, month);
  const [attendance, holidays, leaves] = await Promise.all([
    Attendance.find({ user: userId, date: { $gte: start, $lte: end } }),
    Holiday.find({ date: { $gte: start, $lte: end }, isActive: true }),
    LeaveRequest.find({ user: userId, status: 'APPROVED', startDate: { $lte: end }, endDate: { $gte: start } }),
  ]);

  const attByDay = {};
  attendance.forEach((a) => {
    const key = toISODate(a.date);
    attByDay[key] = a;
  });
  const holByDay = {};
  holidays.forEach((h) => {
    const key = toISODate(h.date);
    holByDay[key] = h;
  });
  const leaveDays = {};
  leaves.forEach((l) => {
    const d = new Date(l.startDate);
    const last = new Date(l.endDate);
    while (d <= last) {
      const key = toISODate(d);
      if (key >= toISODate(start) && key <= toISODate(end)) leaveDays[key] = l;
      d.setDate(d.getDate() + 1);
    }
  });

  const days = [];
  const today = toISODate(new Date());
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toISODate(d);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const hol = holByDay[key];
    const leave = leaveDays[key];
    const att = attByDay[key];
    let status;
    if (hol) status = ATTENDANCE_STATUS.HOLIDAY;
    else if (leave) status = ATTENDANCE_STATUS.ON_LEAVE;
    else if (att) status = att.status;
    else if (isWeekend) status = 'WEEKEND';
    else if (key < today) status = ATTENDANCE_STATUS.ABSENT;
    else status = 'UPCOMING';

    days.push({
      date: key,
      isWeekend,
      holiday: hol ? { name: hol.name } : null,
      status,
      attendance: att
        ? {
            clockIn: att.clockIn,
            clockOut: att.clockOut,
            workingHours: att.workingHours,
            isLate: att.isLate,
          }
        : null,
    });
  }

  const present = days.filter((d) => d.status === ATTENDANCE_STATUS.PRESENT).length;
  const half = days.filter((d) => d.status === ATTENDANCE_STATUS.HALF_DAY).length;
  const absent = days.filter((d) => d.status === ATTENDANCE_STATUS.ABSENT).length;
  const onLeave = days.filter((d) => d.status === ATTENDANCE_STATUS.ON_LEAVE).length;
  const holidaysCount = days.filter((d) => d.status === ATTENDANCE_STATUS.HOLIDAY).length;
  const totalHours = attendance.reduce((s, a) => s + (a.workingHours || 0), 0);

  return { days, summary: { present, half, absent, onLeave, holidays: holidaysCount, totalHours, month: monthLabel(month, year) } };
};

const myMonth = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const data = await monthView(req.user._id, year, month);
  res.json({ success: true, data });
});

const teamMonth = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const userId = req.query.userId;
  const { start, end } = getMonthRange(year, month);

  const isAdmin = req.user.role === 'HR_ADMIN';
  let users;
  if (userId) {
    users = await User.find({ _id: userId, status: 'ACTIVE' }).select('firstName lastName employeeId email department');
  } else if (isAdmin) {
    users = await User.find({ status: 'ACTIVE' }).select('firstName lastName employeeId email department');
  } else {
    users = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('firstName lastName employeeId email department');
  }

  const result = await Promise.all(
    users.map(async (u) => {
      const view = await monthView(u._id, year, month);
      return { user: u, summary: view.summary, todayStatus: await getTodayStatus(u._id) };
    })
  );

  res.json({ success: true, data: { users: result, month: monthLabel(month, year) } });
});

const getTodayStatus = async (userId) => {
  const record = await attendanceService.findToday(userId, new Date());
  const leave = await LeaveRequest.findOne({
    user: userId,
    status: 'APPROVED',
    startDate: { $lte: endOfDay(new Date()) },
    endDate: { $gte: startOfDay(new Date()) },
  });
  const holiday = await Holiday.findOne({ date: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) }, isActive: true });
  if (holiday) return 'HOLIDAY';
  if (leave) return 'ON_LEAVE';
  if (record) return record.status;
  return 'ABSENT';
};

const records = asyncHandler(async (req, res) => {
  const { userId, start, end, page = 1, limit = 20 } = req.query;
  const query = {};
  if (userId) {
    const target = await User.findById(userId);
    if (!target) return next(new AppError('User not found.', 404));
    if (req.user.role === 'MANAGER' && String(target.manager) !== String(req.user._id)) {
      return next(new AppError('You can only view attendance of your team.', 403));
    }
    query.user = userId;
  } else if (req.user.role === 'HR_ADMIN') {
    // all
  } else if (req.user.role === 'MANAGER') {
    const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id');
    query.user = { $in: team.map((t) => t._id) };
  } else {
    query.user = req.user._id;
  }

  if (start || end) {
    query.date = {};
    if (start) query.date.$gte = startOfDay(start);
    if (end) query.date.$lte = endOfDay(end);
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 20);
  const data = await Attendance.find(query)
    .populate('user', 'firstName lastName employeeId email')
    .sort({ date: -1, createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await Attendance.countDocuments(query);

  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

module.exports = { clockIn, clockOut, todayStatus, myMonth, teamMonth, records, monthView, getTodayStatus };
