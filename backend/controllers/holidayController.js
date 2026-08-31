const Holiday = require('../models/Holiday');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listHolidays = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const query = { isActive: true };
  if (year) {
    const y = Number(year);
    query.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59, 999) };
  }
  const data = await Holiday.find(query).sort({ date: 1 });
  res.json({ success: true, data });
});

const getHoliday = asyncHandler(async (req, res, next) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) return next(new AppError('Holiday not found.', 404));
  res.json({ success: true, data: holiday });
});

const createHoliday = asyncHandler(async (req, res, next) => {
  const { name, date, description, type } = req.body;
  if (!name || !date) return next(new AppError('Holiday name and date are required.', 400));
  const existing = await Holiday.findOne({ date: { $gte: new Date(new Date(date).setHours(0, 0, 0, 0)), $lte: new Date(new Date(date).setHours(23, 59, 59, 999)) }, isActive: true });
  if (existing) return next(new AppError(`A holiday already exists on ${new Date(date).toLocaleDateString('en-IN')}.`, 409));
  const holiday = await Holiday.create({ name, date, description: description || '', type: type || 'PUBLIC' });
  res.status(201).json({ success: true, message: 'Holiday added.', data: holiday });
});

const updateHoliday = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const holiday = await Holiday.findById(id);
  if (!holiday) return next(new AppError('Holiday not found.', 404));
  const { name, date, description, type, isActive } = req.body;
  if (name) holiday.name = name;
  if (date) holiday.date = date;
  if (description !== undefined) holiday.description = description;
  if (type) holiday.type = type;
  if (isActive !== undefined) holiday.isActive = Boolean(isActive);
  await holiday.save();
  res.json({ success: true, message: 'Holiday updated.', data: holiday });
});

const deleteHoliday = asyncHandler(async (req, res, next) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) return next(new AppError('Holiday not found.', 404));
  holiday.isActive = false;
  await holiday.save();
  res.json({ success: true, message: 'Holiday removed.' });
});

module.exports = { listHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday };
