const LeaveRequest = require('../models/LeaveRequest');
const { startOfDay, endOfDay, dayDiff } = require('../utils/dateUtils');

const ANNUAL_ENTITLEMENT = {
  SICK_LEAVE: 12,
  CASUAL_LEAVE: 12,
  PAID_LEAVE: 10,
  UNPAID_LEAVE: Infinity,
  HALF_DAY: 'PAID_LEAVE',
  FULL_DAY: 'PAID_LEAVE',
};

const durationInDays = (duration) => (duration === 'HALF_DAY' ? 0.5 : 1);

const calcDays = (startDate, endDate, duration) => {
  const diff = dayDiff(startDate, endDate) + 1;
  return duration === 'HALF_DAY' ? 0.5 : diff;
};

const validateLeaveDates = (startDate, endDate, duration) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) throw Object.assign(new Error('Invalid leave dates.'), { statusCode: 400 });
  if (end < start) throw Object.assign(new Error('End date cannot be before start date.'), { statusCode: 400 });
  if (duration === 'HALF_DAY' && dayDiff(start, end) !== 0) {
    throw Object.assign(new Error('Half day leave must be for a single day.'), { statusCode: 400 });
  }
};

const hasOverlap = async (userId, startDate, endDate, excludeId) => {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  const query = {
    user: userId,
    status: { $in: ['PENDING', 'APPROVED'] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await LeaveRequest.findOne(query);
  return Boolean(existing);
};

const consumedDaysFor = async (userId, leaveType, year) => {
  const typeForBalance = ANNUAL_ENTITLEMENT[leaveType];
  if (typeForBalance === undefined || typeForBalance === Infinity) return 0;
  const actualType = typeof typeForBalance === 'string' ? typeForBalance : leaveType;

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  const requests = await LeaveRequest.find({
    user: userId,
    leaveType: { $in: actualType === leaveType ? [leaveType] : ['HALF_DAY', 'FULL_DAY', actualType] },
    status: 'APPROVED',
    startDate: { $gte: start },
    endDate: { $lte: end },
  });

  return requests.reduce((sum, r) => sum + calcDays(r.startDate, r.endDate, r.duration), 0);
};

const getBalances = async (userId, year = new Date().getFullYear()) => {
  const types = ['SICK_LEAVE', 'CASUAL_LEAVE', 'PAID_LEAVE'];
  const result = {};
  for (const t of types) {
    const entitlement = ANNUAL_ENTITLEMENT[t];
    const consumed = await consumedDaysFor(userId, t, year);
    result[t] = {
      entitlement,
      consumed,
      balance: Math.round((entitlement - consumed) * 100) / 100,
    };
  }
  result.UNPAID_LEAVE = { entitlement: 'Unlimited', consumed: 0, balance: 'Unlimited' };
  result.HALF_DAY = { entitlement: 'Uses Paid Leave', consumed: 0, balance: 'Uses Paid Leave' };
  result.FULL_DAY = { entitlement: 'Uses Paid Leave', consumed: 0, balance: 'Uses Paid Leave' };
  return result;
};

const checkSufficientBalance = async (userId, leaveType, days, year = new Date().getFullYear()) => {
  const typeForBalance = ANNUAL_ENTITLEMENT[leaveType];
  if (typeForBalance === undefined) {
    throw Object.assign(new Error(`Invalid leave type: ${leaveType}`), { statusCode: 400 });
  }
  if (typeForBalance === Infinity) return;
  const actualType = typeof typeForBalance === 'string' ? typeForBalance : leaveType;
  const consumed = await consumedDaysFor(userId, leaveType, year);
  if (consumed + days > ANNUAL_ENTITLEMENT[actualType]) {
    throw Object.assign(
      new Error(`Insufficient leave balance for ${actualType}. Available: ${ANNUAL_ENTITLEMENT[actualType] - consumed} days.`),
      { statusCode: 400 }
    );
  }
};

module.exports = {
  ANNUAL_ENTITLEMENT,
  durationInDays,
  calcDays,
  validateLeaveDates,
  hasOverlap,
  getBalances,
  checkSufficientBalance,
  consumedDaysFor,
};
