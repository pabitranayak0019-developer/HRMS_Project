const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const Payslip = require('../models/Payslip');
const SalaryStructure = require('../models/SalaryStructure');
const { WORKING_DAYS_PER_MONTH, ATTENDANCE_STATUS } = require('../config/constants');
const { getMonthRange, toISODate, startOfDay } = require('../utils/dateUtils');

const round2 = (n) => Math.round(n * 100) / 100;

const isBizDay = (d) => {
  const day = d.getDay();
  return day !== 0 && day !== 6;
};

const countBizDays = (start, end) => {
  let count = 0;
  const cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    if (isBizDay(cur)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const listDays = (start, end) => {
  const days = [];
  const cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const collectHolidays = (holidays, start, end) => {
  const map = {};
  const startTs = startOfDay(start).getTime();
  const endTs = startOfDay(end).getTime();
  for (const h of holidays) {
    const ts = startOfDay(h.date).getTime();
    if (ts >= startTs && ts <= endTs && isBizDay(h.date)) map[ts] = h;
  }
  return map;
};

const buildAttendanceSummary = async (user, monthStart, monthEnd, holidays) => {
  const [attendance, leaves] = await Promise.all([
    Attendance.find({ user: user._id, date: { $gte: monthStart, $lte: monthEnd } }),
    LeaveRequest.find({
      user: user._id,
      status: 'APPROVED',
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    }),
  ]);

  const attendanceByDay = {};
  attendance.forEach((a) => {
    const key = startOfDay(a.date).getTime();
    attendanceByDay[key] = a;
  });

  const leaveByDay = {};
  leaves.forEach((l) => {
    listDays(l.startDate, l.endDate).forEach((d) => {
      const ts = startOfDay(d).getTime();
      if (ts >= monthStart.getTime() && ts <= monthEnd.getTime()) {
        if (!leaveByDay[ts]) leaveByDay[ts] = [];
        leaveByDay[ts].push(l);
      }
    });
  });

  const joined = user.employeeProfile ? user.employeeProfile.joiningDate : null;
  const exited = user.employeeProfile && ['TERMINATED', 'INACTIVE'].includes(user.employeeProfile.employmentStatus) ? user.employeeProfile.updatedAt : null;

  let windowStart = new Date(monthStart);
  let windowEnd = new Date(monthEnd);
  if (joined) {
    const j = startOfDay(joined);
    if (j > windowStart) windowStart = new Date(j);
  }
  if (exited) {
    const x = startOfDay(exited);
    if (x < windowEnd) windowEnd = new Date(x);
  }

  const windowBizDays = countBizDays(windowStart, windowEnd);
  const windowHolidayDays = Object.keys(holidays).filter((k) => {
    const ts = Number(k);
    return ts >= windowStart.getTime() && ts <= windowEnd.getTime();
  }).length;
  const windowWorkingDays = windowBizDays - windowHolidayDays;

  const bizDays = listDays(windowStart, windowEnd).filter((d) => isBizDay(d));
  let present = 0;
  let half = 0;
  let paidLeave = 0;
  let unpaidLeave = 0;

  for (const d of bizDays) {
    const ts = d.getTime();
    const holiday = holidays[ts];
    const dayLeaves = leaveByDay[ts] || [];
    const dayAttendance = attendanceByDay[ts];

    if (holiday) continue;

    const isUnpaidLeave = dayLeaves.some((l) => l.leaveType === 'UNPAID_LEAVE');
    const hasPaidLeave = dayLeaves.length > 0 && !isUnpaidLeave;

    if (isUnpaidLeave) {
      unpaidLeave += 1;
    } else if (hasPaidLeave) {
      paidLeave += 1;
    } else if (dayAttendance && dayAttendance.status === ATTENDANCE_STATUS.HALF_DAY) {
      half += 1;
    } else if (dayAttendance && dayAttendance.status === ATTENDANCE_STATUS.PRESENT) {
      present += 1;
    }
  }

  const absent = Math.max(0, windowWorkingDays - present - half * 0.5 - paidLeave - unpaidLeave);

  return {
    presentDays: present,
    halfDays: half,
    absentDays: Math.round(absent * 100) / 100,
    paidLeaveDays: paidLeave,
    unpaidLeaveDays: unpaidLeave,
    holidays: windowHolidayDays,
    workingDays: windowWorkingDays,
    payableBizDays: windowBizDays,
  };
};

const generatePayrollForMonth = async (month, year, employeeIds = null) => {
  const { start, end } = getMonthRange(year, month);
  const totalBizDays = countBizDays(start, end);
  if (totalBizDays === 0) throw new Error(`No business days in ${month}/${year}`);

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end }, isActive: true });
  const holidayMap = collectHolidays(holidays, start, end);

  let users;
  if (employeeIds && employeeIds.length) {
    users = await User.find({ _id: { $in: employeeIds }, status: 'ACTIVE' })
      .populate('employeeProfile')
      .select('-password');
  } else {
    users = await User.find({ status: 'ACTIVE' }).populate('employeeProfile').select('-password');
  }

  const structures = await SalaryStructure.find({ isActive: true });
  const structureByUser = {};
  structures.forEach((s) => {
    if (!structureByUser[s.user] || new Date(s.effectiveFrom) > new Date(structureByUser[s.user].effectiveFrom)) {
      structureByUser[s.user] = s;
    }
  });

  const results = [];
  for (const user of users) {
    const structure = structureByUser[user._id];
    if (!structure) continue;

    const gross = structure.grossSalary;
    const fixedDeductions = structure.totalDeductions;
    const summary = await buildAttendanceSummary(user, start, end, holidayMap);

    const prorationFactor = totalBizDays > 0 ? summary.payableBizDays / totalBizDays : 0;
    const proratedGross = round2(gross * prorationFactor);
    const dailyRate = totalBizDays > 0 ? round2(gross / totalBizDays) : 0;
    const unpaidDays = Math.round((summary.absentDays + summary.unpaidLeaveDays) * 100) / 100;
    const leaveDeduction = round2(dailyRate * unpaidDays);
    const proratedFixed = round2(fixedDeductions * prorationFactor);
    const netSalary = round2(proratedGross - leaveDeduction - proratedFixed);

    const payslip = await Payslip.findOneAndUpdate(
      { user: user._id, month, year },
      {
        $set: {
          user: user._id,
          month,
          year,
          salaryStructure: structure._id,
          earnings: {
            basicSalary: round2(structure.basicSalary * prorationFactor),
            hra: round2((structure.hra || 0) * prorationFactor),
            specialAllowance: round2((structure.specialAllowance || 0) * prorationFactor),
            conveyanceAllowance: round2((structure.conveyanceAllowance || 0) * prorationFactor),
            medicalAllowance: round2((structure.medicalAllowance || 0) * prorationFactor),
            travelAllowance: round2((structure.travelAllowance || 0) * prorationFactor),
            bonus: round2((structure.bonus || 0) * prorationFactor),
            performancePay: round2((structure.performancePay || 0) * prorationFactor),
            otherEarnings: round2((structure.otherEarnings || 0) * prorationFactor),
            grossSalary: proratedGross,
          },
          deductions: {
            pf: round2((structure.pf || 0) * prorationFactor),
            professionalTax: round2((structure.professionalTax || 0) * prorationFactor),
            incomeTax: round2((structure.incomeTax || 0) * prorationFactor),
            insuranceDeduction: round2((structure.insuranceDeduction || 0) * prorationFactor),
            loanDeduction: round2((structure.loanDeduction || 0) * prorationFactor),
            otherDeductions: round2((structure.otherDeductions || 0) * prorationFactor),
            totalDeductions: round2(proratedFixed + leaveDeduction),
          },
          attendanceSummary: {
            presentDays: summary.presentDays,
            halfDays: summary.halfDays,
            absentDays: summary.absentDays,
            paidLeaveDays: summary.paidLeaveDays,
            unpaidLeaveDays: summary.unpaidLeaveDays,
            holidays: summary.holidays,
            workingDays: summary.workingDays,
          },
          proratedDays: summary.payableBizDays,
          adjustedDays: unpaidDays,
          leaveDeduction,
          absenceDeduction: leaveDeduction,
          netSalary,
        },
      },
      { new: true, upsert: true }
    );

    results.push(payslip);
  }

  return results;
};

module.exports = { generatePayrollForMonth, countBizDays, buildAttendanceSummary };
