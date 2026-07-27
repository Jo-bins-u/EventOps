const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, adminOnly, requirePermission } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users
router.get('/', requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { role, domain, status, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (domain) filter.domain = domain;
    if (status) filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(filter).populate('domain', 'name').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('domain', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res) => {
  try {
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isSelf && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    // Non-admins can't change their own role
    if (!isSelf || req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.permissions;
      delete req.body.status;
    }
    delete req.body.password; // use /auth/change-password

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/permissions  (admin only)
router.patch('/:id/permissions', adminOnly, async (req, res) => {
  try {
    const { permissions, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { permissions, role }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ message: 'Cannot delete yourself' });
    await User.findByIdAndUpdate(req.params.id, { status: 'suspended' });
    res.json({ message: 'User suspended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/notif-prefs
router.patch('/:id/notif-prefs', async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByIdAndUpdate(req.params.id, { notifPrefs: req.body }, { new: true });
    res.json(user.notifPrefs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
