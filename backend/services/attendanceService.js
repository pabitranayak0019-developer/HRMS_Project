const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const { ATTENDANCE_STATUS } = require('../config/constants');
const {
  startOfDay,
  endOfDay,
  hoursBetween,
  normalizeWorkingHours,
  isLate,
  getLateMinutes,
} = require('../utils/dateUtils');
const { WORK_HOURS_PER_DAY } = require('../config/constants');

const findToday = async (userId, date = new Date()) => {
  return Attendance.findOne({
    user: userId,
    date: { $gte: startOfDay(date), $lte: endOfDay(date) },
  });
};

const clockIn = async (userId, date = new Date()) => {
  const existing = await findToday(userId, date);
  if (existing) {
    if (existing.clockIn) {
      const err = new Error('You are already clocked in for today.');
      err.statusCode = 400;
      err.code = 'ALREADY_CLOCKED_IN';
      throw err;
    }
    existing.clockIn = date;
    existing.isLate = isLate(date);
    existing.lateMinutes = getLateMinutes(date);
    existing.status = ATTENDANCE_STATUS.PRESENT;
    await existing.save();
    return existing;
  }
  const record = await Attendance.create({
    user: userId,
    date: startOfDay(date),
    clockIn: date,
    isLate: isLate(date),
    lateMinutes: getLateMinutes(date),
    status: ATTENDANCE_STATUS.PRESENT,
  });
  return record;
};

const clockOut = async (userId, date = new Date()) => {
  const record = await findToday(userId, date);
  if (!record) {
    const err = new Error('You have not clocked in today.');
    err.statusCode = 400;
    err.code = 'NOT_CLOCKED_IN';
    throw err;
  }
  if (record.clockOut) {
    const err = new Error('You have already clocked out for today.');
    err.statusCode = 400;
    err.code = 'ALREADY_CLOCKED_OUT';
    throw err;
  }
  record.clockOut = date;
  let hours = hoursBetween(record.clockIn, record.clockOut);
  hours = normalizeWorkingHours(hours);
  record.workingHours = hours;
  record.overtimeHours = Math.max(0, Math.round((hours - WORK_HOURS_PER_DAY) * 100) / 100);
  record.status = hours < WORK_HOURS_PER_DAY * 0.5 ? ATTENDANCE_STATUS.HALF_DAY : ATTENDANCE_STATUS.PRESENT;
  await record.save();
  return record;
};

const getStatusForDate = async (userId, date) => {
  const start = startOfDay(date);
  const end = endOfDay(date);
  const [attendance, leave, holiday] = await Promise.all([
    Attendance.findOne({ user: userId, date: { $gte: start, $lte: end } }),
    LeaveRequest.findOne({
      user: userId,
      status: 'APPROVED',
      startDate: { $lte: end },
      endDate: { $gte: start },
    }),
    Holiday.findOne({ date: { $gte: start, $lte: end }, isActive: true }),
  ]);

  if (holiday) return ATTENDANCE_STATUS.HOLIDAY;
  if (leave) return ATTENDANCE_STATUS.ON_LEAVE;
  if (attendance) return attendance.status;
  return ATTENDANCE_STATUS.ABSENT;
};

module.exports = { findToday, clockIn, clockOut, getStatusForDate };
