const dotenv = require('dotenv');
dotenv.config();

const warn = (msg) => {
  console.warn(`[ENV] ${msg}`);
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms_db',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
};

if (!process.env.JWT_SECRET) {
  warn('JWT_SECRET is not set. Using a development fallback secret. Set JWT_SECRET in .env for production.');
}
env.JWT_SECRET = process.env.JWT_SECRET || 'hrms_dev_insecure_secret_change_me';

module.exports = env;
