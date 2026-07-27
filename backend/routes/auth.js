const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, adminOnly } = require('../middleware/auth');
const { sendEmail } = require('../config/email');

const signToken = (id, secret, expiresIn) =>
  jwt.sign({ id }, secret, { expiresIn });

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', [
  body('emailOrId').notEmpty().withMessage('Email or ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { emailOrId, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrId.toLowerCase() }, { collegeId: emailOrId }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    const token = signToken(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
    const refreshToken = signToken(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);

    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ token, refreshToken, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/register (used by seed only) ─────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'domain_head', 'event_head', 'student_rep', 'volunteer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, role, collegeId, department } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, collegeId, department });
    const token = signToken(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/invite (admin only — creates user + sends welcome email) ──
router.post('/invite', authenticate, adminOnly, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').isIn(['admin', 'domain_head', 'event_head', 'student_rep', 'volunteer']).withMessage('Invalid role'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, role, collegeId, department } = req.body;

    // Check if already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'A user with this email already exists' });

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    const user = await User.create({
      name, email, role,
      password: tempPassword,
      collegeId, department,
      status: 'active',
    });

    // Send welcome email with credentials
    const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const emailHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:28px;">
        <div style="background:#185FA5;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
          <div style="color:#fff;font-size:18px;font-weight:600;">EventOps Platform</div>
          <div style="color:#93c5fd;font-size:13px;margin-top:2px;">Internal Coordination System</div>
        </div>

        <p style="font-size:15px;color:#1a1a18;">Hi ${name},</p>
        <p style="font-size:14px;color:#5f5e5a;line-height:1.6;">
          You've been invited to join <strong>EventOps Platform</strong> as a
          <strong style="color:#185FA5;">${role.replace('_', ' ')}</strong>.
        </p>

        <div style="background:#f1f0e8;border-radius:10px;padding:18px 20px;margin:20px 0;">
          <div style="font-size:12px;color:#888780;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Your login credentials</div>
          <div style="margin-bottom:8px;">
            <span style="font-size:12px;color:#888780;">Email</span><br/>
            <span style="font-size:14px;font-weight:500;color:#1a1a18;">${email}</span>
          </div>
          <div>
            <span style="font-size:12px;color:#888780;">Temporary password</span><br/>
            <span style="font-size:16px;font-weight:600;color:#185FA5;font-family:monospace;letter-spacing:1px;">${tempPassword}</span>
          </div>
        </div>

        <div style="background:#FCEBEB;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
          <span style="font-size:13px;color:#A32D2D;">⚠ Please change your password after your first login.</span>
        </div>

        <a href="${appUrl}/login" style="display:inline-block;background:#185FA5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
          Sign in to EventOps →
        </a>

        <p style="margin-top:28px;font-size:12px;color:#888780;">
          If you didn't expect this invitation, please ignore this email.<br/>
          This invite was sent by an administrator.
        </p>
      </div>
    `;

    await sendEmail(email, 'You have been invited to EventOps Platform', emailHtml);

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      user,
      // Only include temp password in response if email is not configured
      ...(!process.env.SMTP_USER && { tempPassword }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = signToken(decoded.id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
    res.json({ token });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  req.user.lastActive = new Date();
  await req.user.save({ validateBeforeSave: false });
  res.json({ message: 'Logged out' });
});

module.exports = router;
