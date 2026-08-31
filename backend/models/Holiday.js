const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['PUBLIC', 'COMPANY', 'OPTIONAL'], default: 'PUBLIC' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
