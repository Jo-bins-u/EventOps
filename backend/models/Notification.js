const mongoose = require('mongoose');

// ── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_assigned', 'task_overdue', 'task_completed', 'new_message', 'admin_broadcast',
           'important_message', 'file_uploaded', 'event_update', 'deadline_reminder', 'mention'],
    required: true,
  },
  title:    { type: String, required: true },
  body:     { type: String },
  link:     { type: String }, // frontend route
  read:     { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  // Related refs
  event:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  task:     { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  message:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// ── Document ─────────────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  url:        { type: String, required: true },  // Supabase/Storage URL
  publicId:   { type: String },                  // Storage file path/ID
  mimeType:   { type: String },
  size:       { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  task:       { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  // Access control
  accessModel:  { type: String, enum: ['role', 'user', 'hybrid'], default: 'role' },
  allowedRoles: { type: [String], default: ['admin'] },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Features
  canShareInChat: { type: Boolean, default: true },
  canPreview:     { type: Boolean, default: true },
  versions: [{
    url:       String,
    uploadedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt:{ type: Date, default: Date.now },
    note:      String,
  }],
  sharedInMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

// Access check helper
documentSchema.methods.canAccess = function (user) {
  if (user.role === 'admin') return true;
  if (this.accessModel === 'user') {
    return this.allowedUsers.some(id => id.equals(user._id));
  }
  if (this.accessModel === 'role') {
    return this.allowedRoles.includes(user.role);
  }
  // hybrid: role OR user
  return this.allowedRoles.includes(user.role) ||
    this.allowedUsers.some(id => id.equals(user._id));
};

module.exports.Notification = mongoose.model('Notification', notificationSchema);
module.exports.Document = mongoose.model('Document', documentSchema);
