const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  domain:      { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
  eventHead:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate:   { type: Date },
  endDate:     { type: Date },
  venue:       { type: String },
  status:      { type: String, enum: ['draft', 'planning', 'active', 'completed', 'cancelled'], default: 'planning' },
  budget:      { total: Number, spent: Number },
  tags:        [String],
  chatRoom:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  parentEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { virtuals: true } });

// Virtual: task completion %
eventSchema.virtual('completionRate', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'event',
  justOne: false,
});

module.exports = mongoose.model('Event', eventSchema);
