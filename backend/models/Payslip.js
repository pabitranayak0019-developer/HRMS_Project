const mongoose = require('mongoose');
const { PAYSLIP_STATUS } = require('../config/constants');

const payslipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    salaryStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },

    earnings: {
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      conveyanceAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      travelAllowance: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      performancePay: { type: Number, default: 0 },
      otherEarnings: { type: Number, default: 0 },
      grossSalary: { type: Number, default: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      incomeTax: { type: Number, default: 0 },
      insuranceDeduction: { type: Number, default: 0 },
      loanDeduction: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
    },
    attendanceSummary: {
      presentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      holidays: { type: Number, default: 0 },
      workingDays: { type: Number, default: 0 },
    },
    proratedDays: { type: Number, default: 0 },
    adjustedDays: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    absenceDeduction: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: { type: String, enum: PAYSLIP_STATUS, default: 'GENERATED' },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

payslipSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);
