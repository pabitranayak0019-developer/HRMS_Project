const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    workingHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ATTENDANCE_STATUS), default: 'PRESENT' },
    source: { type: String, enum: ['MANUAL', 'SYSTEM'], default: 'MANUAL' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
