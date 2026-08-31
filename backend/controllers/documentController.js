const Document = require('../models/Document');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

const canView = (doc, user) => {
  if (user.role === ROLES.HR_ADMIN) return true;
  if (doc.visibility === 'PUBLIC') return true;
  if (doc.visibility === 'DEPARTMENT' && doc.department && user.department && String(doc.department) === String(user.department._id)) return true;
  if (doc.visibility === 'PRIVATE' && doc.employees && doc.employees.some((e) => String(e) === String(user._id))) return true;
  return false;
};

const listDocuments = asyncHandler(async (req, res) => {
  let docs;
  if (req.user.role === ROLES.HR_ADMIN) {
    docs = await Document.find({ isActive: true }).populate('uploadedBy', 'firstName lastName').sort({ createdAt: -1 });
  } else {
    const all = await Document.find({ isActive: true }).sort({ createdAt: -1 });
    docs = all.filter((d) => canView(d, req.user));
  }
  res.json({ success: true, data: docs });
});

const uploadDocument = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const { title, category, description, visibility, department, employees } = req.body;
  if (!title) return next(new AppError('Document title is required.', 400));
  const doc = await Document.create({
    title,
    category: category || 'OTHER',
    description: description || '',
    fileName: req.file.originalname,
    filePath: req.file.path.replace(/\\/g, '/'),
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedBy: req.user._id,
    visibility: visibility || 'PUBLIC',
    department: department || undefined,
    employees: Array.isArray(employees) ? employees : employees ? [employees] : [],
  });
  res.status(201).json({ success: true, message: 'Document uploaded.', data: doc });
});

const getDocument = asyncHandler(async (req, res, next) => {
  const doc = await Document.findById(req.params.id).populate('uploadedBy', 'firstName lastName');
  if (!doc) return next(new AppError('Document not found.', 404));
  if (!canView(doc, req.user)) return next(new AppError('You do not have access to this document.', 403));
  res.json({ success: true, data: doc });
});

const downloadDocument = asyncHandler(async (req, res, next) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return next(new AppError('Document not found.', 404));
  if (!canView(doc, req.user)) return next(new AppError('You do not have access to this document.', 403));
  const fs = require('fs');
  const path = require('path');
  const absPath = path.resolve(process.cwd(), doc.filePath);
  if (!fs.existsSync(absPath)) return next(new AppError('File missing on server.', 404));
  res.download(absPath, doc.fileName);
});

const deleteDocument = asyncHandler(async (req, res, next) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return next(new AppError('Document not found.', 404));
  doc.isActive = false;
  await doc.save();
  res.json({ success: true, message: 'Document removed.' });
});

module.exports = { listDocuments, uploadDocument, getDocument, downloadDocument, deleteDocument };
