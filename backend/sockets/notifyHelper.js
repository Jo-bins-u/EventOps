const { Notification } = require('../models/Notification');

/**
 * Create notifications in DB and push via socket to online users
 * @param {Object} io - Socket.io server instance
 * @param {Array} recipientIds - Array of user ObjectIds
 * @param {Object} data - Notification data
 */
async function notifyUsers(io, recipientIds, data) {
  if (!recipientIds?.length) return;

  const ids = [...new Set(recipientIds.map(id => id.toString()))];

  const docs = ids.map(id => ({ ...data, recipient: id }));

  try {
    const notifs = await Notification.insertMany(docs);
    // Push to online users via their personal room
    notifs.forEach((notif) => {
      io.to(`user:${notif.recipient}`).emit('notification', notif);
    });
    return notifs;
  } catch (err) {
    console.error('notifyUsers error:', err.message);
  }
}

/**
 * Notify a single user
 */
async function notifyUser(io, recipientId, data) {
  return notifyUsers(io, [recipientId], data);
}

module.exports = { notifyUsers, notifyUser };
