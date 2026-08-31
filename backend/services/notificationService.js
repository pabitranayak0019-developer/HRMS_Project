const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, title, message, link = '' }) => {
  if (!recipient) return null;
  try {
    const notif = await Notification.create({ recipient, type, title, message, link });
    return notif;
  } catch (err) {
    console.error(`Notification create failed: ${err.message}`);
    return null;
  }
};

const notifyMany = async (recipients, payload) => {
  const ops = [];
  for (const r of recipients) {
    if (!r) continue;
    ops.push({
      insertOne: {
        document: {
          recipient: r,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          link: payload.link || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    });
  }
  if (!ops.length) return;
  try {
    await Notification.bulkWrite(ops);
  } catch (err) {
    console.error(`Bulk notification failed: ${err.message}`);
  }
};

const notifyAdmins = async (payload) => {
  const User = require('../models/User');
  const admins = await User.find({ role: 'HR_ADMIN', status: 'ACTIVE' }).select('_id');
  await notifyMany(admins.map((a) => a._id), payload);
};

module.exports = { createNotification, notifyMany, notifyAdmins };
