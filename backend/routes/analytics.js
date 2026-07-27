const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Event = require('../models/Event');
const User = require('../models/User');
const { Message } = require('../models/Message');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate, requirePermission('VIEW_ANALYTICS'));

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const [totalTasks, completedTasks, overdueTasks, activeEvents, totalUsers, activeUsers] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'overdue' }),
      Event.countDocuments({ status: { $in: ['active', 'planning'] } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'active', lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    res.json({
      totalTasks, completedTasks, overdueTasks, activeEvents, totalUsers, activeUsers,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/events
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({ status: { $in: ['active', 'planning', 'completed'] } });
    const result = await Promise.all(events.map(async (ev) => {
      const tasks = await Task.find({ event: ev._id });
      const completed = tasks.filter(t => t.status === 'completed').length;
      const overdue = tasks.filter(t => t.status === 'overdue').length;
      return {
        _id: ev._id, name: ev.name, status: ev.status,
        taskCount: tasks.length, completed, overdue,
        completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/members
router.get('/members', async (req, res) => {
  try {
    const users = await User.find({ status: 'active' }, 'name role domain');
    const result = await Promise.all(users.map(async (u) => {
      const [total, completed, overdue] = await Promise.all([
        Task.countDocuments({ assignedTo: u._id }),
        Task.countDocuments({ assignedTo: u._id, status: 'completed' }),
        Task.countDocuments({ assignedTo: u._id, status: 'overdue' }),
      ]);
      return { _id: u._id, name: u.name, role: u.role, total, completed, overdue, rate: total ? Math.round((completed / total) * 100) : 0 };
    }));
    res.json(result.sort((a, b) => b.completed - a.completed));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/gantt/:eventId
router.get('/gantt/:eventId', async (req, res) => {
  try {
    const tasks = await Task.find({ event: req.params.eventId })
      .populate('assignedTo', 'name')
      .select('title status priority dueDate createdAt assignedTo dependencies');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/timeline  (weekly task trend — last 8 weeks)
router.get('/timeline', async (req, res) => {
  try {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i * 7);
      const end = new Date(start); end.setDate(end.getDate() + 7);
      const [created, completed] = await Promise.all([
        Task.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Task.countDocuments({ completedAt: { $gte: start, $lt: end } }),
      ]);
      weeks.push({ week: start.toLocaleDateString('en', { month: 'short', day: 'numeric' }), created, completed });
    }
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
