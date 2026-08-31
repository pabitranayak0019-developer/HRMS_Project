const User = require('../models/User');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const Payslip = require('../models/Payslip');
const Announcement = require('../models/Announcement');
const PerformanceReview = require('../models/PerformanceReview');
const asyncHandler = require('../utils/asyncHandler');
const { getMonthRange, startOfDay, endOfDay } = require('../utils/dateUtils');
const { ATTENDANCE_STATUS, LEAVE_STATUS } = require('../config/constants');
const { getBalances } = require('../services/leaveService');
const attendanceService = require('../services/attendanceService');

const employeeDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department').populate('manager').populate('employeeProfile');

  const [today, balances, pendingLeaves, latestPayslip, announcements, upcomingHolidays, recentNotifs, thisMonthSummary, totalLeavesThisYear] = await Promise.all([
    attendanceService.findToday(req.user._id, new Date()),
    getBalances(req.user._id),
    LeaveRequest.find({ user: req.user._id, status: 'PENDING' }).sort({ createdAt: -1 }).limit(5),
    Payslip.findOne({ user: req.user._id }).sort({ year: -1, month: -1 }),
    Announcement.find({ isActive: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(4)
      .populate('createdBy', 'firstName lastName'),
    Holiday.find({ date: { $gte: startOfDay(new Date()) }, isActive: true }).sort({ date: 1 }).limit(4),
    require('../models/Notification').find({ recipient: req.user._id, isRead: false }).sort({ createdAt: -1 }).limit(5),
    attendanceService.getStatusForDate ? null : null,
    LeaveRequest.countDocuments({ user: req.user._id, status: { $ne: 'CANCELLED' } }),
  ]);

  const { year, month } = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  const mStart = startOfDay(new Date(year, month - 1, 1));
  const mEnd = endOfDay(new Date(year, month, 0));
  const monthAttendance = await Attendance.find({ user: req.user._id, date: { $gte: mStart, $lte: mEnd } });
  const monthPresent = monthAttendance.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
  const monthHalf = monthAttendance.filter((a) => a.status === ATTENDANCE_STATUS.HALF_DAY).length;
  const monthHours = monthAttendance.reduce((s, a) => s + (a.workingHours || 0), 0);

  res.json({
    success: true,
    data: {
      user,
      today,
      todayStatus: await attendanceService.getStatusForDate(req.user._id, new Date()),
      balances,
      pendingLeaves,
      latestPayslip,
      announcements,
      upcomingHolidays,
      recentNotifications: recentNotifs,
      monthly: { present: monthPresent, half: monthHalf, hours: Math.round(monthHours * 100) / 100, leaveRequests: totalLeavesThisYear },
    },
  });
});

const managerDashboard = asyncHandler(async (req, res) => {
  const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id firstName lastName email employeeId department employeeProfile');
  const teamIds = team.map((t) => t._id);

  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const [todayAttendance, pendingLeaves, holidays] = await Promise.all([
    Attendance.find({ user: { $in: teamIds }, date: { $gte: start, $lte: end } }),
    LeaveRequest.find({ user: { $in: teamIds }, status: 'PENDING' }).sort({ createdAt: 1 }).populate('user', 'firstName lastName employeeId'),
    Holiday.find({ date: { $gte: start, $lte: end }, isActive: true }),
  ]);

  const approvedToday = await LeaveRequest.find({ user: { $in: teamIds }, status: 'APPROVED', startDate: { $lte: end }, endDate: { $gte: start } });

  let present = todayAttendance.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
  let half = todayAttendance.filter((a) => a.status === ATTENDANCE_STATUS.HALF_DAY).length;
  let late = todayAttendance.filter((a) => a.isLate).length;
  let onLeave = approvedToday.length;

  const holidayToday = holidays.length > 0;
  const absent = holidayToday ? 0 : Math.max(0, teamIds.length - present - half - onLeave);

  const { start: mStart, end: mEnd } = getMonthRange(new Date().getFullYear(), new Date().getMonth() + 1);
  const monthAttendance = await Attendance.find({ user: { $in: teamIds }, date: { $gte: mStart, $lte: mEnd } });
  const monthPresent = monthAttendance.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
  const monthAbsent = monthAttendance.filter((a) => a.status === ATTENDANCE_STATUS.ABSENT).length;
  const monthHalfDays = monthAttendance.filter((a) => a.status === ATTENDANCE_STATUS.HALF_DAY).length;

  const monthLeaves = await LeaveRequest.find({ user: { $in: teamIds }, status: 'APPROVED', startDate: { $gte: mStart }, endDate: { $lte: mEnd } });
  const leaveDays = monthLeaves.reduce((s, l) => s + (l.numberOfDays || 0), 0);

  const reviews = await PerformanceReview.find({ manager: req.user._id }).sort({ reviewDate: -1 }).limit(5);

  const recentActivity = await LeaveRequest.find({ user: { $in: teamIds } })
    .sort({ updatedAt: -1 })
    .limit(6)
    .populate('user', 'firstName lastName employeeId');

  res.json({
    success: true,
    data: {
      teamSize: teamIds.length,
      present,
      half,
      absent,
      late,
      onLeave,
      holidayToday,
      attendanceRate: teamIds.length ? Math.round(((present + half * 0.5 + onLeave) / teamIds.length) * 100) : 0,
      pendingLeaves,
      monthSummary: { present: monthPresent, absent: monthAbsent, half: monthHalfDays, leaveDays: Math.round(leaveDays * 100) / 100 },
      recentReviews: reviews,
      recentActivity,
    },
  });
});

const adminDashboard = asyncHandler(async (req, res) => {
  const [totalEmployees, activeEmployees, totalDepartments, holidays] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'ACTIVE', role: { $ne: 'HR_ADMIN' } }),
    Department.countDocuments({ status: 'ACTIVE' }),
    Holiday.find({}).sort({ date: -1 }).limit(3),
  ]);

  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const [todayAttendance, todayLeaves, pendingLeaves] = await Promise.all([
    Attendance.find({ date: { $gte: start, $lte: end } }).populate('user', 'firstName lastName employeeId'),
    LeaveRequest.find({ status: 'APPROVED', startDate: { $lte: end }, endDate: { $gte: start } }),
    LeaveRequest.countDocuments({ status: 'PENDING' }),
  ]);

  const holidayToday = await Holiday.findOne({ date: { $gte: start, $lte: end }, isActive: true });
  const present = todayAttendance.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
  const half = todayAttendance.filter((a) => a.status === ATTENDANCE_STATUS.HALF_DAY).length;
  const late = todayAttendance.filter((a) => a.isLate).length;
  const onLeave = todayLeaves.length;
  const absent = holidayToday ? 0 : Math.max(0, activeEmployees - present - half - onLeave);
  const attendanceRate = activeEmployees ? Math.round(((present + half * 0.5 + onLeave) / activeEmployees) * 100) : 0;

  const departments = await Department.find({ status: 'ACTIVE' }).sort({ name: 1 });
  const deptStats = await Promise.all(
    departments.map(async (d) => ({
      _id: d._id,
      name: d.name,
      count: await User.countDocuments({ department: d._id, status: 'ACTIVE' }),
    }))
  );

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const { start: mStart, end: mEnd } = getMonthRange(year, month);

  const [monthAttendance, monthApprovedLeaves, allUsers, latestPayslips, upcomingHolidays] = await Promise.all([
    Attendance.find({ date: { $gte: mStart, $lte: mEnd } }),
    LeaveRequest.find({ status: 'APPROVED', startDate: { $gte: mStart }, endDate: { $lte: mEnd } }),
    User.find({ status: 'ACTIVE' }).select('_id'),
    Payslip.find({ month, year }).select('netSalary earnings.grossSalary user'),
    Holiday.find({ date: { $gte: startOfDay(new Date()) }, isActive: true }).sort({ date: 1 }).limit(4),
  ]);

  const payrollGross = latestPayslips.reduce((s, p) => s + (p.earnings.grossSalary || 0), 0);
  const payrollNet = latestPayslips.reduce((s, p) => s + (p.netSalary || 0), 0);

  const trendMonthPresent = [];
  const trendMonthAbsent = [];
  for (let m = 1; m <= month; m++) {
    const { start: s, end: e } = getMonthRange(year, m);
    const att = await Attendance.find({ date: { $gte: s, $lte: e } });
    const leaves = await LeaveRequest.find({ status: 'APPROVED', startDate: { $gte: s }, endDate: { $lte: e } });
    const hols = await Holiday.countDocuments({ date: { $gte: s, $lte: e }, isActive: true });
    const workingDays = await getBizDayCount(s, e, hols);
    trendMonthPresent.push({ month: m, label: new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'short' }), present: att.filter((a) => a.status === 'PRESENT').length, absent: att.filter((a) => a.status === 'ABSENT').length, leaveDays: leaves.reduce((x, l) => x + l.numberOfDays, 0) });
    trendMonthAbsent.push({ month: m, workingDays });
  }

  const leaveTrend = [];
  for (let m = 1; m <= month; m++) {
    const { start: s, end: e } = getMonthRange(year, m);
    const leaves = await LeaveRequest.find({ status: 'APPROVED', startDate: { $gte: s }, endDate: { $lte: e } });
    const byType = {};
    leaves.forEach((l) => {
      byType[l.leaveType] = (byType[l.leaveType] || 0) + l.numberOfDays;
    });
    leaveTrend.push({ month: m, label: new Date(year, m - 1, 1).toLocaleString('en-IN', { month: 'short' }), ...byType });
  }

  res.json({
    success: true,
    data: {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      present,
      absent,
      half,
      late,
      onLeave,
      attendanceRate,
      pendingLeaves,
      holidayToday: Boolean(holidayToday),
      deptStats,
      payroll: { gross: payrollGross, net: payrollNet, payslips: latestPayslips.length },
      attendanceTrend: trendMonthPresent,
      leaveTrend,
      upcomingHolidays,
      recentHolidays: holidays,
      employeesByRole: {
        managers: await User.countDocuments({ role: 'MANAGER', status: 'ACTIVE' }),
        employees: await User.countDocuments({ role: 'EMPLOYEE', status: 'ACTIVE' }),
      },
    },
  });
});

const getBizDayCount = async (start, end, holidays = 0) => {
  let count = 0;
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(0, count - holidays);
};

module.exports = { employeeDashboard, managerDashboard, adminDashboard };
