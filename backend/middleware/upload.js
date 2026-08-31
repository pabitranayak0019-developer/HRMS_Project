const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    const subDir = file.fieldname === 'photo' ? 'photos' : file.fieldname === 'receipt' ? 'receipts' : 'documents';
    const dir = path.join(uploadRoot, subDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const random = crypto.randomBytes(8).toString('hex');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    cb(null, `${Date.now()}_${random}_${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type "${file.mimetype}". Allowed: images, PDF, DOC, XLS, TXT, CSV.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

module.exports = { upload, allowedTypes };
