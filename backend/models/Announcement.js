const mongoose = require('mongoose');
const { ANNOUNCEMENT_PRIORITY } = require('../config/constants');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ANNOUNCEMENT_PRIORITY, default: 'NORMAL' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachment: { type: String, default: '' },
    targetRoles: [{ type: String }],
    pinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
