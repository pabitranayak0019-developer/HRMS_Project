const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['OFFER_LETTER', 'APPOINTMENT_LETTER', 'HR_POLICY', 'PAYSLIP', 'ID_CARD', 'OFFICIAL', 'CERTIFICATE', 'OTHER'],
      default: 'OTHER',
    },
    description: { type: String, default: '' },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'DEPARTMENT', 'PRIVATE'],
      default: 'PUBLIC',
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
