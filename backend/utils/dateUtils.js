const { LATE_THRESHOLD_MINUTES, WORK_HOURS_PER_DAY } = require('../config/constants');

const startOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const endOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
};

const toISODate = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dateKey = (d) => startOfDay(d).toISOString();

const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const dayDiff = (a, b) => {
  return Math.round((startOfDay(b) - startOfDay(a)) / (1000 * 60 * 60 * 24));
};

const hoursBetween = (start, end) => {
  if (!start || !end) return 0;
  const diffMs = new Date(end) - new Date(start);
  if (diffMs <= 0) return 0;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

const normalizeWorkingHours = (h) => {
  let hours = h;
  const maxDaily = WORK_HOURS_PER_DAY * 2;
  if (hours > maxDaily) hours = maxDaily;
  return Math.round(hours * 100) / 100;
};

const getLateMinutes = (clockIn, officeStartMinutes = 9 * 60) => {
  if (!clockIn) return 0;
  const d = new Date(clockIn);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const diff = minutes - officeStartMinutes;
  return diff > 0 ? diff : 0;
};

const isLate = (clockIn, threshold = LATE_THRESHOLD_MINUTES) => {
  return getLateMinutes(clockIn) > threshold;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const monthLabel = (month, year) => `${MONTHS[month - 1]} ${year}`;

module.exports = {
  startOfDay,
  endOfDay,
  toISODate,
  dateKey,
  getMonthRange,
  dayDiff,
  hoursBetween,
  normalizeWorkingHours,
  getLateMinutes,
  isLate,
  MONTHS,
  monthLabel,
};
