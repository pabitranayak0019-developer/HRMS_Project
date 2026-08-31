const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate value for ${field}. This record already exists.`, 409);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(messages.join('. '), 400);
  }

  if (err.name === 'CastError') {
    error = new AppError(`Invalid value provided for ${err.path}.`, 400);
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

  if (statusCode === 500) {
    console.error(`[ERROR] ${error.stack || error.message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' && statusCode === 500 ? error.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
