const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const myNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Number(limit) || 20);
  const data = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await Notification.countDocuments({ recipient: req.user._id });
  const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }, unread });
});

const unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, unread });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Notification.updateOne({ _id: id, recipient: req.user._id }, { isRead: true, readAt: new Date() });
  res.json({ success: true });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { myNotifications, unreadCount, markRead, markAllRead };
