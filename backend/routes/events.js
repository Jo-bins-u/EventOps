const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { ChatRoom } = require('../models/Message');
const { Notification } = require('../models/Notification');
const { authenticate, requirePermission } = require('../middleware/auth');
const { notifyUsers } = require('../sockets/notifyHelper');

// All routes require auth
router.use(authenticate);

// GET /api/events  — list with optional filters
router.get('/', async (req, res) => {
  try {
    const { domain, status, search, parentEvent, isSubEvent } = req.query;
    const filter = {};
    if (domain) filter.domain = domain;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    
    if (parentEvent) {
      filter.parentEvent = parentEvent;
    } else if (isSubEvent === 'true') {
      filter.parentEvent = { $ne: null };
    } else if (isSubEvent === 'false') {
      filter.parentEvent = null;
    }

    // Non-admins only see events they're members of
    if (req.user.role !== 'admin') {
      filter.$or = [{ members: req.user._id }, { eventHead: req.user._id }, { createdBy: req.user._id }];
    }

    const events = await Event.find(filter)
      .populate('domain', 'name color')
      .populate('eventHead', 'name email')
      .populate('members', 'name email role')
      .populate('parentEvent', 'name')
      .sort({ startDate: 1 });

    // Attach task stats
    const withStats = await Promise.all(events.map(async (ev) => {
      const tasks = await Task.find({ event: ev._id });
      const completed = tasks.filter(t => t.status === 'completed').length;
      return { ...ev.toJSON(), taskCount: tasks.length, completedTasks: completed, completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
    }));

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events — create event
router.post('/', requirePermission('CREATE_EVENT'), [
  body('name').trim().notEmpty(),
  body('domain').isMongoId(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });

    // Auto-create a chat room for this event
    const room = await ChatRoom.create({ name: event.name, type: 'event', event: event._id, createdBy: req.user._id });
    event.chatRoom = room._id;
    await event.save();

    // Notify domain members
    const io = req.app.get('io');
    await notifyUsers(io, event.members, {
      type: 'event_update',
      title: `New event: ${event.name}`,
      body: `Created by ${req.user.name}`,
      link: `/events/${event._id}`,
      event: event._id,
      sender: req.user._id,
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('domain', 'name color icon')
      .populate('eventHead', 'name email role')
      .populate('members', 'name email role')
      .populate('parentEvent', 'name description')
      .populate('createdBy', 'name');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/events/:id
router.patch('/:id', requirePermission('CREATE_EVENT'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', requirePermission('CREATE_EVENT'), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ event: req.params.id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/members  — add member
router.post('/:id/members', requirePermission('MANAGE_DOMAIN'), async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findByIdAndUpdate(req.params.id, { $addToSet: { members: userId } }, { new: true }).populate('members', 'name email role');
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/events/:id/members/:userId
router.delete('/:id/members/:userId', requirePermission('MANAGE_DOMAIN'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { $pull: { members: req.params.userId } }, { new: true });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
