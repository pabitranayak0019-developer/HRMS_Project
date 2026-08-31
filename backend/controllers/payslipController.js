const Payslip = require('../models/Payslip');
const User = require('../models/User');
const SalaryStructure = require('../models/SalaryStructure');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generatePayslipPDF } = require('../services/pdfService');

const myPayslips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(60, Number(limit) || 12);
  const data = await Payslip.find({ user: req.user._id })
    .sort({ year: -1, month: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await Payslip.countDocuments({ user: req.user._id });
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const getPayslip = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const payslip = await Payslip.findById(id);
  if (!payslip) return next(new AppError('Payslip not found.', 404));
  if (req.user.role !== 'HR_ADMIN' && String(payslip.user) !== String(req.user._id)) {
    return next(new AppError('You can only view your own payslips.', 403));
  }
  res.json({ success: true, data: payslip });
});

const listAll = asyncHandler(async (req, res) => {
  const { month, year, userId, page = 1, limit = 20 } = req.query;
  const query = {};
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);
  if (userId) query.user = userId;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 20);
  const data = await Payslip.find(query)
    .populate('user', 'firstName lastName employeeId department')
    .sort({ year: -1, month: -1, createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await Payslip.countDocuments(query);
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

const downloadPdf = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const payslip = await Payslip.findById(id);
  if (!payslip) return next(new AppError('Payslip not found.', 404));
  if (req.user.role !== 'HR_ADMIN' && String(payslip.user) !== String(req.user._id)) {
    return next(new AppError('You can only download your own payslips.', 403));
  }
  const user = await User.findById(payslip.user).populate('employeeProfile').populate('department');
  const structure = payslip.salaryStructure ? await SalaryStructure.findById(payslip.salaryStructure) : null;
  const pdfBuffer = await generatePayslipPDF(payslip, user, user.employeeProfile, user.department, structure);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="payslip_${user.employeeId}_${payslip.year}_${String(payslip.month).padStart(2, '0')}.pdf"`);
  res.send(pdfBuffer);
});

module.exports = { myPayslips, getPayslip, listAll, downloadPdf };
