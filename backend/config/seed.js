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

  // Create default domains requested by user
  const defaultDomains = [
    {
      name: 'Technical',
      description: 'Technical events, coding seminars, workshops, and computer science competitions.',
      color: '#185FA5',
      icon: '⚙',
    },
    {
      name: 'Cultural',
      description: 'Music, dance, drama, fashion shows, and art exhibits.',
      color: '#534AB7',
      icon: '🎭',
    },
    {
      name: 'Sports',
      description: 'Athletics, tournaments, indoor and outdoor games.',
      color: '#0F6E56',
      icon: '🏅',
    },
    {
      name: 'Fest',
      description: 'Department festivals, carnivals, and cultural fests.',
      color: '#854F0B',
      icon: '🎪',
    }
  ];

  for (const dom of defaultDomains) {
    await Domain.create({
      ...dom,
      head: admin._id,
      members: [admin._id],
      createdBy: admin._id,
    });
    console.log('Created Domain:', dom.name);
  }

  console.log('\n✅ Database cleaned. Admin and default domains seeded!');
  console.log('Login with: admin@college.edu / demo123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
