const mongoose = require('mongoose');
const { PERF_STATUS } = require('../config/constants');

const performanceReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true, trim: true },
    reviewDate: { type: Date, default: Date.now },
    goals: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        weight: { type: Number, default: 10, min: 0, max: 100 },
        status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'NOT_ACHIEVED'], default: 'NOT_STARTED' },
      },
    ],
    ratings: {
      technicalSkills: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      teamwork: { type: Number, min: 1, max: 5 },
      initiative: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      overallRating: { type: Number, min: 1, max: 5 },
    },
    strengths: { type: String, default: '' },
    improvements: { type: String, default: '' },
    managerComments: { type: String, default: '' },
    employeeComments: { type: String, default: '' },
    status: { type: String, enum: PERF_STATUS, default: 'DRAFT' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
