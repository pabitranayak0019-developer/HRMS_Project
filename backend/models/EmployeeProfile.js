const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    photo: { type: String, default: '' },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'OTHER' },
    dob: { type: Date },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    pincode: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    designation: { type: String, default: '' },
    joiningDate: { type: Date },
    employmentStatus: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'], default: 'ACTIVE' },
    employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'PROBATION'], default: 'FULL_TIME' },
    bank: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branch: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    passportNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    aadhaarNumber: { type: String, default: '' },
    education: { type: String, default: '' },
    skills: [String],
    idCardValidity: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);
