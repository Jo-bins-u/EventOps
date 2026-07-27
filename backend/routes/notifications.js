const express = require('express');
const router = express.Router();
const { Notification } = require('../models/Notification');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const notifs = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name role')
      .populate('event', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications/broadcast  (admin only)
router.post('/broadcast', adminOnly, async (req, res) => {
  try {
    const { title, body, link } = req.body;
    const User = require('../models/User');
    const users = await User.find({ status: 'active' }, '_id');
    const notifs = users.map(u => ({
      recipient: u._id, type: 'admin_broadcast',
      title, body, link, priority: 'high', sender: req.user._id,
    }));
    await Notification.insertMany(notifs);

    // Broadcast via socket
    const io = req.app.get('io');
    io.emit('notification', { type: 'admin_broadcast', title, body, link, priority: 'high' });

    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
