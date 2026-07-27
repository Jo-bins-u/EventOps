const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true, trim: true },
  description:{ type: String },
  head:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  color:      { type: String, default: '#185FA5' },
  icon:       { type: String, default: '◈' },
  status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatRoom:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
}, { timestamps: true });

module.exports = mongoose.model('Domain', domainSchema);
