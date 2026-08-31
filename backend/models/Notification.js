const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'LEAVE_SUBMITTED',
        'LEAVE_APPROVED',
        'LEAVE_REJECTED',
        'PAYSLIP_GENERATED',
        'NEW_ANNOUNCEMENT',
        'UPCOMING_HOLIDAY',
        'EXPENSE_APPROVED',
        'EXPENSE_REJECTED',
        'EXPENSE_SUBMITTED',
        'PERFORMANCE_REVIEW',
        'ATTENDANCE',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
