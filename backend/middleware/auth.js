const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next(new AppError('Not authorized. Please login.', 401));

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please login again.', 401));
      }
      return next(new AppError('Invalid token. Please login again.', 401));
    }

    const user = await User.findById(decoded.id).populate('department').populate('employeeProfile');
    if (!user) return next(new AppError('User no longer exists.', 401));
    if (user.status !== 'ACTIVE') return next(new AppError('Your account is deactivated.', 403));

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Not authorized.', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
