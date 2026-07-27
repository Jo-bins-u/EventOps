const express = require('express');
const router = express.Router();
const Domain = require('../models/Domain');
const { ChatRoom } = require('../models/Message');
const { authenticate, requirePermission, adminOnly } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const domains = await Domain.find().populate('head', 'name email').populate('members', 'name email role').sort({ name: 1 });
    res.json(domains);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const domain = await Domain.create({ ...req.body, createdBy: req.user._id });
    const room = await ChatRoom.create({ name: domain.name, type: 'domain', domain: domain._id, createdBy: req.user._id });
    domain.chatRoom = room._id;
    await domain.save();
    res.status(201).json(domain);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', requirePermission('MANAGE_DOMAIN'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(domain);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/members', requirePermission('MANAGE_DOMAIN'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, { $addToSet: { members: req.body.userId } }, { new: true }).populate('members', 'name email role');
    res.json(domain);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/members/:userId', requirePermission('MANAGE_DOMAIN'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, { $pull: { members: req.params.userId } }, { new: true });
    res.json(domain);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
