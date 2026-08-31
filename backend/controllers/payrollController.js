const SalaryStructure = require('../models/SalaryStructure');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generatePayrollForMonth } = require('../services/payrollService');
const { getMonthRange } = require('../utils/dateUtils');

const getMyStructure = asyncHandler(async (req, res) => {
  const structure = await SalaryStructure.findOne({ user: req.user._id, isActive: true }).sort({ effectiveFrom: -1 });
  res.json({ success: true, data: structure });
});

const getStructureForUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const structure = await SalaryStructure.find({ user: id }).sort({ effectiveFrom: -1 });
  if (!structure.length) return res.json({ success: true, data: null });
  res.json({ success: true, data: structure });
});

const saveStructure = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const target = await User.findById(id);
  if (!target) return next(new AppError('Employee not found.', 404));

  const data = req.body;
  const basicSalary = Number(data.basicSalary);
  if (isNaN(basicSalary) || basicSalary < 0) return next(new AppError('Basic salary must be a valid non-negative number.', 400));

  const numericFields = [
    'hra', 'specialAllowance', 'conveyanceAllowance', 'medicalAllowance', 'travelAllowance',
    'bonus', 'performancePay', 'otherEarnings', 'pf', 'professionalTax', 'incomeTax', 'insuranceDeduction', 'loanDeduction', 'otherDeductions',
  ];
  const payload = { user: id, basicSalary };
  numericFields.forEach((f) => {
    if (data[f] !== undefined) payload[f] = Number(data[f]) || 0;
  });
  payload.effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();
  payload.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;

  const structure = await SalaryStructure.create(payload);
  res.status(201).json({ success: true, message: 'Salary structure saved.', data: structure });
});

const updateStructure = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const structure = await SalaryStructure.findById(id);
  if (!structure) return next(new AppError('Salary structure not found.', 404));
  const data = req.body;
  const numericFields = [
    'basicSalary', 'hra', 'specialAllowance', 'conveyanceAllowance', 'medicalAllowance', 'travelAllowance',
    'bonus', 'performancePay', 'otherEarnings', 'pf', 'professionalTax', 'incomeTax', 'insuranceDeduction', 'loanDeduction', 'otherDeductions',
  ];
  numericFields.forEach((f) => {
    if (data[f] !== undefined) structure[f] = Number(data[f]) || 0;
  });
  if (data.effectiveFrom) structure.effectiveFrom = new Date(data.effectiveFrom);
  if (data.isActive !== undefined) structure.isActive = Boolean(data.isActive);
  await structure.save();
  res.json({ success: true, message: 'Salary structure updated.', data: structure });
});

const deleteStructure = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const structure = await SalaryStructure.findById(id);
  if (!structure) return next(new AppError('Salary structure not found.', 404));
  structure.isActive = false;
  await structure.save();
  res.json({ success: true, message: 'Salary structure deactivated.' });
});

const listAllStructures = asyncHandler(async (req, res) => {
  const structures = await SalaryStructure.find({ isActive: true })
    .populate('user', 'firstName lastName email employeeId department')
    .sort({ effectiveFrom: -1 });
  res.json({ success: true, data: structures });
});

const generatePayroll = asyncHandler(async (req, res, next) => {
  const { month, year, employeeIds } = req.body;
  const m = Number(month);
  const y = Number(year);
  if (!m || !y || m < 1 || m > 12) return next(new AppError('Provide a valid month (1-12) and year.', 400));

  const { start, end } = getMonthRange(y, m);
  const existing = require('../models/Payslip').find({ month: m, year: y }).countDocuments();
  const willOverwrite = existing > 0;

  const slips = await generatePayrollForMonth(m, y, employeeIds);

  const { createNotification, notifyMany } = require('../services/notificationService');
  await notifyMany(
    slips.map((s) => s.user),
    {
      type: 'PAYSLIP_GENERATED',
      title: 'Payslip generated',
      message: `Your payslip for ${require('../utils/dateUtils').monthLabel(m, y)} is ready.`,
      link: '/payslips',
    }
  );

  res.json({
    success: true,
    message: `Payroll generated for ${slips.length} employee(s)${willOverwrite ? ' (overwrote existing slips)' : ''}.`,
    count: slips.length,
    data: slips,
  });
});

const payrollSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const Payslip = require('../models/Payslip');
  const slips = await Payslip.find({ month: m, year: y })
    .populate('user', 'firstName lastName employeeId department')
    .sort({ 'earnings.grossSalary': -1 });
  const totalGross = slips.reduce((s, p) => s + (p.earnings.grossSalary || 0), 0);
  const totalDeductions = slips.reduce((s, p) => s + (p.deductions.totalDeductions || 0), 0);
  const totalNet = slips.reduce((s, p) => s + (p.netSalary || 0), 0);
  res.json({
    success: true,
    data: { month: m, year: y, count: slips.length, totalGross, totalDeductions, totalNet, slips },
  });
});

module.exports = {
  getMyStructure,
  getStructureForUser,
  saveStructure,
  updateStructure,
  deleteStructure,
  listAllStructures,
  generatePayroll,
  payrollSummary,
};
