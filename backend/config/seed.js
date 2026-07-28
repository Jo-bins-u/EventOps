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

  // 1. Create default administrator
  const admin = await User.create({
    name: 'Administrator',
    email: 'admin@college.edu',
    collegeId: 'FAC2026-001',
    password: 'demo123',
    role: 'admin',
    department: 'Administration',
  });
  console.log('Created Admin User:', admin.email);

  // 2. Create default Technical domain
  const domain = await Domain.create({
    name: 'Technical',
    description: 'Technical events, symposiums, hackathons, and programming contests.',
    head: admin._id,
    members: [admin._id],
    color: '#185FA5',
    icon: '⚙',
    createdBy: admin._id,
  });
  console.log('Created Domain:', domain.name);

  // 3. Create parent Overall Event
  const overallStartDate = new Date();
  overallStartDate.setDate(overallStartDate.getDate() + 30); // 30 days from now
  const overallEndDate = new Date(overallStartDate);
  overallEndDate.setDate(overallEndDate.getDate() + 2); // 32 days from now

  const parentEvent = await Event.create({
    name: 'Annual College Symposium 2026',
    description: 'The main annual college symposium hosting multiple technical and design subevents.',
    domain: domain._id,
    eventHead: admin._id,
    members: [admin._id],
    startDate: overallStartDate,
    endDate: overallEndDate,
    venue: 'Main Campus Arena',
    status: 'planning',
    parentEvent: null,
    createdBy: admin._id,
  });

  const parentChat = await ChatRoom.create({
    name: parentEvent.name,
    type: 'event',
    event: parentEvent._id,
    members: [admin._id],
    createdBy: admin._id,
  });

  parentEvent.chatRoom = parentChat._id;
  await parentEvent.save();
  console.log('Created Overall Event:', parentEvent.name);

  // 4. Create child subevents
  const subevent1 = await Event.create({
    name: 'Web Dev Hackathon',
    description: 'A 24-hour web development competition under the Annual College Symposium.',
    domain: domain._id,
    eventHead: admin._id,
    members: [admin._id],
    startDate: overallStartDate,
    endDate: overallStartDate,
    venue: 'Computer Science Lab 3',
    status: 'planning',
    parentEvent: parentEvent._id,
    createdBy: admin._id,
  });

  const chat1 = await ChatRoom.create({
    name: subevent1.name,
    type: 'event',
    event: subevent1._id,
    members: [admin._id],
    createdBy: admin._id,
  });

  subevent1.chatRoom = chat1._id;
  await subevent1.save();
  console.log('Created Subevent 1:', subevent1.name);

  const subevent2StartDate = new Date(overallStartDate);
  subevent2StartDate.setDate(subevent2StartDate.getDate() + 1);

  const subevent2 = await Event.create({
    name: 'Coding Battle',
    description: 'A competitive programming contest under the Annual College Symposium.',
    domain: domain._id,
    eventHead: admin._id,
    members: [admin._id],
    startDate: subevent2StartDate,
    endDate: subevent2StartDate,
    venue: 'Auditorium 2',
    status: 'planning',
    parentEvent: parentEvent._id,
    createdBy: admin._id,
  });

  const chat2 = await ChatRoom.create({
    name: subevent2.name,
    type: 'event',
    event: subevent2._id,
    members: [admin._id],
    createdBy: admin._id,
  });

  subevent2.chatRoom = chat2._id;
  await subevent2.save();
  console.log('Created Subevent 2:', subevent2.name);

  console.log('\n✅ Clean seed complete!');
  console.log('Login with: admin@college.edu / demo123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
