const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String },
  event:        { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate:      { type: Date },
  status:       { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' },
  priority:     { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
  source:       { type: String, enum: ['manual', 'chat', 'calendar'], default: 'manual' },
  sourceMessage:{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  completedAt:  { type: Date },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  attachments:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  comments: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text:    String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Auto mark overdue
taskSchema.pre('find', function () {
  this.where({ status: { $ne: 'completed' }, dueDate: { $lt: new Date() } })
    .updateMany({ status: 'overdue' });
});

taskSchema.index({ event: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
