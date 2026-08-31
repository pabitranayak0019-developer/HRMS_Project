const mongoose = require('mongoose');
const { LEAVE_STATUS, LEAVE_DURATION } = require('../config/constants');

const leaveRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: { type: String, required: true },
    duration: { type: String, enum: LEAVE_DURATION, default: 'FULL_DAY' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(LEAVE_STATUS), default: 'PENDING' },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalComment: { type: String, default: '' },
    appliedToManager: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
