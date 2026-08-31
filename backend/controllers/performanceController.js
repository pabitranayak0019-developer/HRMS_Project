const PerformanceReview = require('../models/PerformanceReview');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');
const { createNotification } = require('../services/notificationService');

const createReview = asyncHandler(async (req, res, next) => {
  const { userId, period, goals, ratings, strengths, improvements, managerComments, reviewDate } = req.body;
  if (!userId || !period) return next(new AppError('Employee and review period are required.', 400));
  if (req.user.role !== ROLES.HR_ADMIN && String(req.user._id) === String(userId)) {
    return next(new AppError('You cannot review yourself.', 400));
  }
  const target = await User.findById(userId);
  if (!target) return next(new AppError('Employee not found.', 404));
  if (req.user.role === ROLES.MANAGER && String(target.manager || '') !== String(req.user._id)) {
    return next(new AppError('You can only review employees in your team.', 403));
  }

  const ratingVals = ratings || {};
  const provided = [ratingVals.technicalSkills, ratingVals.communication, ratingVals.teamwork, ratingVals.initiative, ratingVals.punctuality]
    .map(Number)
    .filter((v) => !isNaN(v) && v > 0);
  const overall = ratingVals.overallRating ? ratingVals.overallRating : provided.length ? provided.reduce((s, v) => s + v, 0) / provided.length : undefined;

  const review = await PerformanceReview.create({
    user: userId,
    manager: req.user._id,
    period,
    reviewDate: reviewDate || Date.now(),
    goals: goals || [],
    ratings: { ...ratingVals, overallRating: overall !== undefined ? Number(overall.toFixed(1)) : undefined },
    strengths: strengths || '',
    improvements: improvements || '',
    managerComments: managerComments || '',
    status: 'SUBMITTED',
  });

  await createNotification({
    recipient: target._id,
    type: 'PERFORMANCE_REVIEW',
    title: 'New performance review',
    message: `Your manager has completed a performance review for ${period}.`,
    link: '/performance',
  });

  res.status(201).json({ success: true, message: 'Performance review created.', data: review });
});

const updateReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const review = await PerformanceReview.findById(id);
  if (!review) return next(new AppError('Review not found.', 404));
  if (String(review.manager) !== String(req.user._id) && req.user.role !== ROLES.HR_ADMIN) {
    return next(new AppError('Only the review owner can edit.', 403));
  }
  const { goals, ratings, strengths, improvements, managerComments, status, employeeComments } = req.body;
  if (goals) review.goals = goals;
  if (ratings) {
    review.ratings = { ...review.ratings, ...ratings };
    const r = review.ratings;
    if (r.technicalSkills || r.communication || r.teamwork || r.initiative || r.punctuality) {
      const vals = [r.technicalSkills, r.communication, r.teamwork, r.initiative, r.punctuality].filter((v) => v);
      if (vals.length) {
        review.ratings.overallRating = Number((vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1));
      }
    }
  }
  if (strengths !== undefined) review.strengths = strengths;
  if (improvements !== undefined) review.improvements = improvements;
  if (managerComments !== undefined) review.managerComments = managerComments;
  if (employeeComments !== undefined) review.employeeComments = employeeComments;
  if (status) review.status = status;
  await review.save();

  if (status && status !== review.status) {
    await createNotification({
      recipient: review.user,
      type: 'PERFORMANCE_REVIEW',
      title: 'Review status updated',
      message: `Your performance review for ${review.period} is now ${status}.`,
      link: '/performance',
    });
  }

  res.json({ success: true, message: 'Review updated.', data: review });
});

const myReviews = asyncHandler(async (req, res) => {
  const data = await PerformanceReview.find({ user: req.user._id })
    .populate('manager', 'firstName lastName')
    .sort({ reviewDate: -1 });
  res.json({ success: true, data });
});

const listReviews = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const query = {};
  if (userId) {
    query.user = userId;
  } else if (req.user.role === ROLES.MANAGER) {
    const team = await User.find({ manager: req.user._id, status: 'ACTIVE' }).select('_id');
    query.user = { $in: team.map((t) => t._id) };
  }
  const data = await PerformanceReview.find(query)
    .populate('user', 'firstName lastName employeeId email')
    .populate('manager', 'firstName lastName')
    .sort({ reviewDate: -1 })
    .limit(200);
  res.json({ success: true, data });
});

const getReview = asyncHandler(async (req, res, next) => {
  const review = await PerformanceReview.findById(req.params.id).populate('user', 'firstName lastName employeeId').populate('manager', 'firstName lastName');
  if (!review) return next(new AppError('Review not found.', 404));
  if (req.user.role !== ROLES.HR_ADMIN && String(review.user) !== String(req.user._id) && String(review.manager) !== String(req.user._id)) {
    return next(new AppError('You do not have access to this review.', 403));
  }
  res.json({ success: true, data: review });
});

module.exports = { createReview, updateReview, myReviews, listReviews, getReview };
