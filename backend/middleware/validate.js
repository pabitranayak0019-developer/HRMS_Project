const AppError = require('../utils/AppError');

const required = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const v = req.body[f];
      return v === undefined || v === null || String(v).trim() === '';
    });
    if (missing.length) {
      return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
    }
    next();
  };
};

const isEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const isDate = (d) => !isNaN(new Date(d).getTime());
const isNumber = (n) => typeof n === 'number' && !isNaN(n);

module.exports = { required, isEmail, isDate, isNumber };
