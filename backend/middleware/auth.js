const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── HTTP middleware ──────────────────────────────────────────────────────────

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.status === 'suspended') return res.status(403).json({ message: 'Account suspended' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access guard
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient role' });
  }
  next();
};

// Permission-based access guard
exports.requirePermission = (permission) => (req, res, next) => {
  const { user } = req;
  if (user.role === 'admin') return next(); // admins have all permissions
  if (user.permissions?.includes(permission)) return next();
  return res.status(403).json({ message: `Missing permission: ${permission}` });
};

// Admin shorthand
exports.adminOnly = exports.requireRole('admin');

// ── Socket.io middleware ─────────────────────────────────────────────────────

exports.authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};
