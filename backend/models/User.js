const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'domain_head', 'event_head', 'student_rep', 'volunteer'];

const ROLE_DEFAULT_PERMISSIONS = {
  admin: ['CREATE_EVENT', 'ASSIGN_TASK', 'VIEW_ANALYTICS', 'MANAGE_USERS', 'UPLOAD_DOCS', 'BROADCAST', 'DELETE_CONTENT', 'MANAGE_DOMAIN'],
  domain_head: ['CREATE_EVENT', 'ASSIGN_TASK', 'VIEW_ANALYTICS', 'UPLOAD_DOCS', 'MANAGE_DOMAIN'],
  event_head: ['ASSIGN_TASK', 'VIEW_ANALYTICS', 'UPLOAD_DOCS'],
  student_rep: ['UPLOAD_DOCS', 'VIEW_TASKS'],
  volunteer: ['VIEW_TASKS'],
};

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  collegeId:  { type: String, unique: true, sparse: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ROLES, default: 'volunteer' },
  permissions: { type: [String], default: [] }, // overrides on top of role defaults
  domain:     { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  department: { type: String },
  status:     { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  avatar:     { type: String },
  notifPrefs: {
    taskAssigned:     { type: Boolean, default: true },
    deadlineReminder: { type: Boolean, default: true },
    chatMentions:     { type: Boolean, default: true },
    allMessages:      { type: Boolean, default: false },
    adminBroadcast:   { type: Boolean, default: true },
    emailDigest:      { type: Boolean, default: true },
    emailOverdue:     { type: Boolean, default: true },
  },
  lastActive: { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Get all effective permissions (role defaults + overrides)
userSchema.methods.getPermissions = function () {
  const defaults = ROLE_DEFAULT_PERMISSIONS[this.role] || [];
  return [...new Set([...defaults, ...this.permissions])];
};

userSchema.methods.hasPermission = function (perm) {
  if (this.role === 'admin') return true;
  return this.getPermissions().includes(perm);
};

userSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => { delete ret.password; return ret; },
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
module.exports.ROLE_DEFAULT_PERMISSIONS = ROLE_DEFAULT_PERMISSIONS;
