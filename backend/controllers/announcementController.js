const Announcement = require('../models/Announcement');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');
const { notifyMany } = require('../services/notificationService');

const listAnnouncements = asyncHandler(async (req, res) => {
  const query = { isActive: true, $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
  if (req.user.role === ROLES.EMPLOYEE) {
    query.$and = [
      { $or: [{ targetRoles: { $exists: false } }, { targetRoles: [] }, { targetRoles: req.user.role }, { targetRoles: { $size: 0 } }] },
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
    ];
  }
  const data = await Announcement.find(req.user.role === ROLES.EMPLOYEE ? query : { isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ pinned: -1, createdAt: -1 })
    .limit(50);
  res.json({ success: true, data });
});

const getAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'firstName lastName');
  if (!announcement) return next(new AppError('Announcement not found.', 404));
  res.json({ success: true, data: announcement });
});

const createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, description, priority, pinned, targetRoles, expiresAt } = req.body;
  if (!title || !description) return next(new AppError('Title and description are required.', 400));
  const announcement = await Announcement.create({
    title,
    description,
    priority: priority || 'NORMAL',
    pinned: Boolean(pinned),
    targetRoles: targetRoles || [],
    expiresAt: expiresAt || null,
    createdBy: req.user._id,
    attachment: req.file ? req.file.path.replace(/\\/g, '/') : '',
  });

  const User = require('../models/User');
  const targets = await User.find({ status: 'ACTIVE' }).select('_id role');
  const filtered = announcement.targetRoles.length ? targets.filter((t) => announcement.targetRoles.includes(t.role)) : targets;
  await notifyMany(
    filtered.map((t) => t._id),
    {
      type: 'NEW_ANNOUNCEMENT',
      title: announcement.priority === 'URGENT' ? 'URGENT announcement' : 'New announcement',
      message: announcement.title,
      link: '/announcements',
    }
  );

  res.status(201).json({ success: true, message: 'Announcement published.', data: announcement });
});

const updateAnnouncement = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const announcement = await Announcement.findById(id);
  if (!announcement) return next(new AppError('Announcement not found.', 404));
  const { title, description, priority, pinned, targetRoles, expiresAt, isActive } = req.body;
  if (title) announcement.title = title;
  if (description) announcement.description = description;
  if (priority) announcement.priority = priority;
  if (pinned !== undefined) announcement.pinned = Boolean(pinned);
  if (targetRoles) announcement.targetRoles = targetRoles;
  if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;
  if (isActive !== undefined) announcement.isActive = Boolean(isActive);
  if (req.file) announcement.attachment = req.file.path.replace(/\\/g, '/');
  await announcement.save();
  res.json({ success: true, message: 'Announcement updated.', data: announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return next(new AppError('Announcement not found.', 404));
  announcement.isActive = false;
  await announcement.save();
  res.json({ success: true, message: 'Announcement removed.' });
});

module.exports = { listAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement };
