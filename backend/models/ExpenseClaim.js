const mongoose = require('mongoose');
const { EXPENSE_STATUS, EXPENSE_CATEGORIES } = require('../config/constants');

const expenseClaimSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true },
    description: { type: String, default: '' },
    receiptFile: { type: String, default: '' },
    status: { type: String, enum: Object.values(EXPENSE_STATUS), default: 'PENDING' },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalComment: { type: String, default: '' },
    approvedAmount: { type: Number },
    reimbursedDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExpenseClaim', expenseClaimSchema);
