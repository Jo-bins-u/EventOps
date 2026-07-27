const { Message } = require('../models/Message');

function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Socket connected: ${user.name} (${user.role})`);

    // Join user's personal room (for targeted notifications)
    socket.join(`user:${user._id}`);

    // ── Room management ──────────────────────────────────────────────────────
    socket.on('join:room', (roomId) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave:room', (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    // Join event room (for task updates, etc.)
    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`);
    });

    // ── Typing indicators ────────────────────────────────────────────────────
    socket.on('chat:typing', ({ roomId, isTyping }) => {
      socket.to(`room:${roomId}`).emit('chat:typing', {
        userId: user._id,
        userName: user.name,
        isTyping,
      });
    });

    // ── Read receipts ────────────────────────────────────────────────────────
    socket.on('chat:read', async ({ roomId, messageId }) => {
      await Message.updateMany(
        { room: roomId, readBy: { $ne: user._id } },
        { $addToSet: { readBy: user._id } }
      );
      socket.to(`room:${roomId}`).emit('chat:read', { userId: user._id, roomId, messageId });
    });

    // ── Task status update (real-time) ───────────────────────────────────────
    socket.on('task:status', ({ taskId, status, eventId }) => {
      io.to(`event:${eventId}`).emit('task:updated', { taskId, status, updatedBy: user.name });
    });

    // ── Admin broadcast ──────────────────────────────────────────────────────
    socket.on('admin:broadcast', (message) => {
      if (user.role !== 'admin') return;
      io.emit('notification', {
        type: 'admin_broadcast',
        title: message.title,
        body: message.body,
        priority: 'high',
        sender: { name: user.name, role: user.role },
      });
    });

    // ── Ping/pong heartbeat ──────────────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong'));

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${user.name} — ${reason}`);
    });
  });
}

module.exports = { initSocketHandlers };
