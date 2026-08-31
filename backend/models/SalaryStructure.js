const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    effectiveFrom: { type: Date, required: true },
    basicSalary: { type: Number, required: true, min: 0 },
    hra: { type: Number, default: 0, min: 0 },
    specialAllowance: { type: Number, default: 0, min: 0 },
    conveyanceAllowance: { type: Number, default: 0, min: 0 },
    medicalAllowance: { type: Number, default: 0, min: 0 },
    travelAllowance: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    performancePay: { type: Number, default: 0, min: 0 },
    otherEarnings: { type: Number, default: 0, min: 0 },
    pf: { type: Number, default: 0, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },
    incomeTax: { type: Number, default: 0, min: 0 },
    insuranceDeduction: { type: Number, default: 0, min: 0 },
    loanDeduction: { type: Number, default: 0, min: 0 },
    otherDeductions: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

salaryStructureSchema.index({ user: 1, effectiveFrom: 1 });

salaryStructureSchema.virtual('grossSalary').get(function () {
  return (
    (this.basicSalary || 0) +
    (this.hra || 0) +
    (this.specialAllowance || 0) +
    (this.conveyanceAllowance || 0) +
    (this.medicalAllowance || 0) +
    (this.travelAllowance || 0) +
    (this.bonus || 0) +
    (this.performancePay || 0) +
    (this.otherEarnings || 0)
  );
});

salaryStructureSchema.virtual('totalDeductions').get(function () {
  return (
    (this.pf || 0) +
    (this.professionalTax || 0) +
    (this.incomeTax || 0) +
    (this.insuranceDeduction || 0) +
    (this.loanDeduction || 0) +
    (this.otherDeductions || 0)
  );
});

salaryStructureSchema.virtual('netSalary').get(function () {
  return this.grossSalary - this.totalDeductions;
});

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
