const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  type:       { type: String, enum: ['event', 'domain', 'broadcast', 'direct'], default: 'event' },
  event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  domain:     { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  members:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  color:      { type: String, default: '#185FA5' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  room:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true, maxlength: 4000 },
  type:     { type: String, enum: ['text', 'file', 'system', 'announcement'], default: 'text' },
  pinned:   { type: Boolean, default: false },
  starred:  { type: Boolean, default: false },
  starredBy:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  edited:   { type: Boolean, default: false },
  editedAt: { type: Date },
  deletedAt:{ type: Date },
  // File attachment
  file: {
    url:      String,
    name:     String,
    size:     Number,
    mimeType: String,
  },
  // Task/calendar conversion metadata
  convertedTo: {
    type:   { type: String, enum: ['task', 'calendar', 'reminder'] },
    refId:  { type: mongoose.Schema.Types.ObjectId },
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });

module.exports.ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
module.exports.Message = mongoose.model('Message', messageSchema);
