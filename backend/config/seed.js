require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Domain = require('../models/Domain');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { ChatRoom, Message } = require('../models/Message');
const { Notification } = require('../models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventops');
  console.log('Connected to MongoDB');

  // Wipe existing data completely
  await Promise.all([
    User.deleteMany(),
    Domain.deleteMany(),
    Event.deleteMany(),
    Task.deleteMany(),
    ChatRoom.deleteMany(),
    Message.deleteMany(),
    Notification.deleteMany(),
  ]);
  console.log('Wiped all existing collections');

  // Create default administrator
  const admin = await User.create({
    name: 'Administrator',
    email: 'admin@college.edu',
    collegeId: 'FAC2026-001',
    password: 'demo123',
    role: 'admin',
    department: 'Administration',
  });
  console.log('Created Admin User:', admin.email);

  // Create default Technical domain (required so Admin can create first overall event)
  const domain = await Domain.create({
    name: 'Technical',
    description: 'Technical events, symposiums, hackathons, and programming contests.',
    head: admin._id,
    members: [admin._id],
    color: '#185FA5',
    icon: '⚙',
    createdBy: admin._id,
  });
  console.log('Created Default Domain:', domain.name);

  console.log('\n✅ Database cleaned. Admin and Technical domain seeded!');
  console.log('Login with: admin@college.edu / demo123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
