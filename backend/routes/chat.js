const express = require('express');
const router = express.Router();
const { ChatRoom, Message } = require('../models/Message');
const { authenticate, requirePermission } = require('../middleware/auth');
const { notifyUsers } = require('../sockets/notifyHelper');

router.use(authenticate);

// GET /api/chat/rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ members: req.user._id })
      .populate('event', 'name')
      .populate('domain', 'name')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/rooms
router.post('/rooms', requirePermission('CREATE_EVENT'), async (req, res) => {
  try {
    const room = await ChatRoom.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/rooms/:id/messages  (paginated)
router.get('/rooms/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ room: req.params.id, deletedAt: null })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    // Mark as read
    await Message.updateMany({ room: req.params.id, readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/rooms/:id/messages
router.post('/rooms/:id/messages', async (req, res) => {
  try {
    const { content, type, file } = req.body;
    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const message = await Message.create({
      room: room._id, sender: req.user._id, content, type, file,
      readBy: [req.user._id],
    });
    await message.populate('sender', 'name email role');

    // Emit to room via socket
    const io = req.app.get('io');
    io.to(`room:${room._id}`).emit('chat:message', message);

    // Notify non-sender room members for important messages
    if (req.user.role === 'admin') {
      const otherMembers = room.members.filter(id => !id.equals(req.user._id));
      await notifyUsers(io, otherMembers, {
        type: 'important_message',
        title: `Admin message in ${room.name}`,
        body: content.slice(0, 80),
        link: `/chat`,
        message: message._id,
        sender: req.user._id,
        priority: 'high',
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/chat/messages/:id/pin
router.patch('/messages/:id/pin', requirePermission('ASSIGN_TASK'), async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, [{ $set: { pinned: { $not: '$pinned' } } }], { new: true });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/chat/messages/:id/star
router.patch('/messages/:id/star', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    const alreadyStarred = msg.starredBy.includes(req.user._id);
    if (alreadyStarred) {
      msg.starredBy.pull(req.user._id);
    } else {
      msg.starredBy.push(req.user._id);
    }
    msg.starred = msg.starredBy.length > 0;
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/chat/messages/:id (soft delete)
router.delete('/messages/:id', requirePermission('DELETE_CONTENT'), async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { deletedAt: new Date(), content: '[deleted]' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/rooms/:id/pinned
router.get('/rooms/:id/pinned', async (req, res) => {
  try {
    const msgs = await Message.find({ room: req.params.id, pinned: true })
      .populate('sender', 'name role');
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
