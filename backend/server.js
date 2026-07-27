require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const domainRoutes = require('./routes/domains');
const eventRoutes = require('./routes/events');
const taskRoutes = require('./routes/tasks');
const chatRoutes = require('./routes/chat');
const notifRoutes = require('./routes/notifications');
const docRoutes = require('./routes/documents');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const { initSocketHandlers } = require('./sockets/socketHandlers');
const { authenticateSocket } = require('./middleware/auth');

const path = require('path');

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

// Make io accessible in routes
app.set('io', io);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts' });
app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/domains',       domainRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/documents',     docRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/ai',            aiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Serve static frontend assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../react-app/build')));
  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../react-app/build', 'index.html'));
  });
}

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Socket.io ───────────────────────────────────────────────────────────────
io.use(authenticateSocket);
initSocketHandlers(io);

// ── Database + start ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };
