const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate, requirePermission } = require('../middleware/auth');
const { notifyUsers } = require('../sockets/notifyHelper');

router.use(authenticate);

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { event, status, assignedTo, priority, overdue } = req.query;
    const filter = {};
    if (event) filter.event = event;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'completed' };
    }
    if (req.user.role !== 'admin') {
      filter.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name')
      .populate('event', 'name')
      .sort({ dueDate: 1 });

    // Auto-flag overdue tasks
    const now = new Date();
    const updated = tasks.map(t => {
      if (t.status !== 'completed' && t.dueDate && t.dueDate < now) {
        t.status = 'overdue';
      }
      return t;
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post('/', requirePermission('ASSIGN_TASK'), async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate(['assignedTo', 'event', 'createdBy']);

    // Notify assignee
    if (task.assignedTo) {
      const io = req.app.get('io');
      await notifyUsers(io, [task.assignedTo._id], {
        type: 'task_assigned',
        title: `New task: ${task.title}`,
        body: `Assigned by ${req.user.name}${task.dueDate ? ` · Due ${task.dueDate.toDateString()}` : ''}`,
        link: `/tasks`,
        task: task._id,
        event: task.event?._id,
        sender: req.user._id,
        priority: task.priority === 'critical' ? 'high' : 'normal',
      });
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name')
      .populate('event', 'name')
      .populate('sourceMessage');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const wasCompleted = task.status !== 'completed' && req.body.status === 'completed';
    Object.assign(task, req.body);
    if (wasCompleted) task.completedAt = new Date();
    await task.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`event:${task.event}`).emit('task:updated', task);

    // Notify creator if completed by assignee
    if (wasCompleted && task.assignedTo?.toString() !== task.createdBy?.toString()) {
      await notifyUsers(io, [task.createdBy], {
        type: 'task_completed',
        title: `Task completed: ${task.title}`,
        body: `Completed by ${req.user.name}`,
        link: `/tasks`,
        task: task._id,
        sender: req.user._id,
      });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', requirePermission('DELETE_CONTENT'), async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user._id, text: req.body.text } } },
      { new: true }
    ).populate('comments.user', 'name');
    res.json(task.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
