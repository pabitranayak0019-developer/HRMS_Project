const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../utils/serializer');
const { sendMail } = require('../services/emailService');

const signToken = (id) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const login = asyncHandler(async (req, res, next) => {
  const { identifier, password, rememberMe } = req.body;
  if (!identifier || !password) {
    return next(new AppError('Please provide email/employee ID and password.', 400));
  }

  const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
  const query = isEmail ? { email: identifier.toLowerCase() } : { employeeId: String(identifier).trim() };
  const user = await User.findOne(query)
    .select('+password')
    .populate('department')
    .populate('manager')
    .populate('employeeProfile');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid credentials. Please try again.', 401));
  }
  if (user.status !== 'ACTIVE') {
    return next(new AppError('Your account is inactive. Contact HR.', 403));
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;

  res.json({
    success: true,
    token,
    expiresIn,
    user: serializeUser(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department').populate('manager').populate('employeeProfile');
  res.json({ success: true, user: serializeUser(user) });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return next(new AppError('Provide current and new password.', 400));
  if (newPassword.length < 6) return next(new AppError('New password must be at least 6 characters.', 400));

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }
  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError('Please provide your email.', 400));
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetToken = hashed;
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  await sendMail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Hello ${user.firstName},</p><p>Click the link below to reset your password (valid 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return next(new AppError('Token and new password are required.', 400));
  if (newPassword.length < 6) return next(new AppError('Password must be at least 6 characters.', 400));

  const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Invalid or expired reset token.', 400));

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. You can now login.' });
});

module.exports = { login, getMe, changePassword, forgotPassword, resetPassword, signToken };
