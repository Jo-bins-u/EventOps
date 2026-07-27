require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Domain = require('../models/Domain');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { ChatRoom, Message } = require('../models/Message');
const { Notification } = require('../models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Wipe existing data
  await Promise.all([
    User.deleteMany(), Domain.deleteMany(), Event.deleteMany(),
    Task.deleteMany(), ChatRoom.deleteMany(), Message.deleteMany(),
    Notification.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = await User.create([
    { name: 'Sarah Chen',   email: 'admin@college.edu',      collegeId: 'FAC2024-001', password: 'demo123', role: 'admin',       department: 'Computer Science' },
    { name: 'Ananya Patel', email: 'domainhead@college.edu', collegeId: 'STU2024-002', password: 'demo123', role: 'domain_head', department: 'Information Technology' },
    { name: 'Rohan Mehta',  email: 'eventhead@college.edu',  collegeId: 'STU2025-047', password: 'demo123', role: 'event_head',  department: 'Computer Science' },
    { name: 'Priya Kumar',  email: 'priya@college.edu',      collegeId: 'STU2025-012', password: 'demo123', role: 'event_head',  department: 'Arts & Design' },
    { name: 'Karan Singh',  email: 'karan@college.edu',      collegeId: 'STU2025-033', password: 'demo123', role: 'volunteer',   department: 'Mechanical Engineering' },
    { name: 'Vivek Nair',   email: 'vivek@college.edu',      collegeId: 'STU2025-021', password: 'demo123', role: 'student_rep', department: 'Electronics' },
  ]);

  const [sarah, ananya, rohan, priya, karan, vivek] = users;
  console.log(`Created ${users.length} users`);

  // ── Domains ────────────────────────────────────────────────────────────────
  const techDomain = await Domain.create({
    name: 'Technical', description: 'Technology events — symposiums, hackathons, workshops',
    head: ananya._id, members: [ananya._id, rohan._id, vivek._id, sarah._id],
    color: '#185FA5', icon: '⚙', createdBy: sarah._id,
  });
  const culturalDomain = await Domain.create({
    name: 'Cultural', description: 'Cultural events — fests, performances, competitions',
    head: priya._id, members: [priya._id, karan._id, sarah._id],
    color: '#534AB7', icon: '🎭', createdBy: sarah._id,
  });
  const sportsDomain = await Domain.create({
    name: 'Sports', description: 'Sports events and inter-department tournaments',
    head: karan._id, members: [karan._id, vivek._id, sarah._id],
    color: '#0F6E56', icon: '🏅', createdBy: sarah._id,
  });
  console.log('Created 3 domains');

  // ── Chat Rooms ─────────────────────────────────────────────────────────────
  const techDomainRoom = await ChatRoom.create({
    name: 'Technical Domain', type: 'domain', domain: techDomain._id,
    members: techDomain.members, color: '#185FA5', createdBy: sarah._id,
  });
  const broadcastRoom = await ChatRoom.create({
    name: 'Admin Broadcast', type: 'broadcast',
    members: users.map(u => u._id), color: '#A32D2D', createdBy: sarah._id,
  });
  techDomain.chatRoom = techDomainRoom._id;
  culturalDomain.chatRoom = (await ChatRoom.create({ name: 'Cultural Domain', type: 'domain', domain: culturalDomain._id, members: culturalDomain.members, color: '#534AB7', createdBy: sarah._id }))._id;
  await Promise.all([techDomain.save(), culturalDomain.save()]);

  // ── Events ─────────────────────────────────────────────────────────────────
  const techEvent = await Event.create({
    name: 'Tech Symposium 2025',
    description: 'Annual technical showcase featuring guest speakers, project demos, and workshops.',
    domain: techDomain._id, eventHead: rohan._id,
    members: [sarah._id, ananya._id, rohan._id, vivek._id, karan._id],
    startDate: new Date('2025-05-15'), endDate: new Date('2025-05-16'),
    venue: 'Auditorium A', status: 'active',
    budget: { total: 50000, spent: 21000 },
    createdBy: sarah._id,
  });
  const techEventRoom = await ChatRoom.create({
    name: 'Tech Symposium 2025', type: 'event', event: techEvent._id,
    members: techEvent.members, color: '#185FA5', createdBy: sarah._id,
  });
  techEvent.chatRoom = techEventRoom._id;
  await techEvent.save();

  const culturalEvent = await Event.create({
    name: 'Cultural Fest',
    description: 'Multi-day cultural celebration featuring performances, competitions, and food festival.',
    domain: culturalDomain._id, eventHead: priya._id,
    members: [sarah._id, priya._id, karan._id],
    startDate: new Date('2025-05-22'), endDate: new Date('2025-05-24'),
    venue: 'Main Ground', status: 'planning',
    budget: { total: 80000, spent: 12000 },
    createdBy: sarah._id,
  });
  const culturalEventRoom = await ChatRoom.create({
    name: 'Cultural Fest', type: 'event', event: culturalEvent._id,
    members: culturalEvent.members, color: '#534AB7', createdBy: sarah._id,
  });
  culturalEvent.chatRoom = culturalEventRoom._id;
  await culturalEvent.save();

  const hackathon = await Event.create({
    name: 'Hackathon 2025',
    description: '48-hour coding challenge with mentors, problem sets, and prizes.',
    domain: techDomain._id, eventHead: ananya._id,
    members: [sarah._id, ananya._id, rohan._id, vivek._id],
    startDate: new Date('2025-06-01'), endDate: new Date('2025-06-02'),
    venue: 'Innovation Lab', status: 'planning',
    budget: { total: 30000, spent: 5000 },
    createdBy: sarah._id,
  });
  const hackRoom = await ChatRoom.create({
    name: 'Hackathon 2025', type: 'event', event: hackathon._id,
    members: hackathon.members, color: '#854F0B', createdBy: sarah._id,
  });
  hackathon.chatRoom = hackRoom._id;
  await hackathon.save();

  console.log('Created 3 events with chat rooms');

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasks = await Task.create([
    // Tech Symposium tasks
    { title: 'Book venue for Tech Symposium', event: techEvent._id, assignedTo: ananya._id, createdBy: sarah._id, dueDate: new Date('2025-05-05'), status: 'completed', completedAt: new Date('2025-05-04'), priority: 'high' },
    { title: 'Create event poster v1', event: techEvent._id, assignedTo: priya._id, createdBy: sarah._id, dueDate: new Date('2025-05-06'), status: 'completed', completedAt: new Date('2025-05-05'), priority: 'normal' },
    { title: 'Finalize speaker list', event: techEvent._id, assignedTo: rohan._id, createdBy: sarah._id, dueDate: new Date('2025-05-08'), status: 'overdue', priority: 'high', description: 'Confirm all 5 speakers and collect bio, photo, and talk title.' },
    { title: 'Send participant invites', event: techEvent._id, assignedTo: ananya._id, createdBy: sarah._id, dueDate: new Date('2025-05-10'), status: 'in_progress', priority: 'high' },
    { title: 'Coordinate with catering vendor', event: techEvent._id, assignedTo: karan._id, createdBy: sarah._id, dueDate: new Date('2025-05-12'), status: 'in_progress', priority: 'normal' },
    { title: 'Set up registration form', event: techEvent._id, assignedTo: vivek._id, createdBy: rohan._id, dueDate: new Date('2025-05-09'), status: 'pending', priority: 'normal' },
    { title: 'AV equipment setup plan', event: techEvent._id, assignedTo: karan._id, createdBy: sarah._id, dueDate: new Date('2025-05-13'), status: 'pending', priority: 'normal' },
    { title: 'Event day logistics checklist', event: techEvent._id, assignedTo: rohan._id, createdBy: sarah._id, dueDate: new Date('2025-05-14'), status: 'pending', priority: 'high' },
    // Cultural Fest tasks
    { title: 'Design promo posters', event: culturalEvent._id, assignedTo: priya._id, createdBy: sarah._id, dueDate: new Date('2025-05-14'), status: 'in_progress', priority: 'normal' },
    { title: 'Book auditorium for performances', event: culturalEvent._id, assignedTo: priya._id, createdBy: sarah._id, dueDate: new Date('2025-05-10'), status: 'completed', completedAt: new Date('2025-05-09'), priority: 'high' },
    { title: 'Performer outreach and contracts', event: culturalEvent._id, assignedTo: karan._id, createdBy: priya._id, dueDate: new Date('2025-05-15'), status: 'pending', priority: 'high' },
    { title: 'Food stall vendor coordination', event: culturalEvent._id, assignedTo: karan._id, createdBy: sarah._id, dueDate: new Date('2025-05-18'), status: 'pending', priority: 'normal' },
    // Hackathon tasks
    { title: 'Draft problem statements', event: hackathon._id, assignedTo: ananya._id, createdBy: sarah._id, dueDate: new Date('2025-05-20'), status: 'in_progress', priority: 'critical' },
    { title: 'Set up registration portal', event: hackathon._id, assignedTo: vivek._id, createdBy: ananya._id, dueDate: new Date('2025-05-18'), status: 'pending', priority: 'normal' },
    { title: 'Sponsor outreach', event: hackathon._id, assignedTo: rohan._id, createdBy: sarah._id, dueDate: new Date('2025-05-12'), status: 'overdue', priority: 'high' },
    { title: 'Judge panel coordination', event: hackathon._id, assignedTo: ananya._id, createdBy: sarah._id, dueDate: new Date('2025-05-25'), status: 'pending', priority: 'high' },
  ]);
  console.log(`Created ${tasks.length} tasks`);

  // ── Messages ───────────────────────────────────────────────────────────────
  const msgs = await Message.create([
    {
      room: techEventRoom._id, sender: sarah._id,
      content: 'Team, reminder: speaker confirmation deadline is tomorrow by 5 PM. Please update your assigned names.',
      type: 'announcement', pinned: true, starred: true, readBy: [sarah._id, rohan._id, ananya._id],
    },
    {
      room: techEventRoom._id, sender: rohan._id,
      content: 'Got it! I have 3 speakers confirmed — will send the full list by end of day. Should we have a backup speaker?',
      readBy: [rohan._id, sarah._id],
    },
    {
      room: techEventRoom._id, sender: ananya._id,
      content: 'Venue confirmed for May 15! Floor plan uploaded to docs. Meeting at 4 PM today to finalize AV setup?',
      readBy: [ananya._id, sarah._id, rohan._id],
    },
    {
      room: broadcastRoom._id, sender: sarah._id,
      content: 'All coordinators meeting tomorrow at 10 AM in Room 204. Attendance is mandatory.',
      type: 'announcement', pinned: true, readBy: users.map(u => u._id),
    },
    {
      room: culturalEventRoom._id, sender: priya._id,
      content: 'Can we move the rehearsal to Friday? The lead performer has a conflict on Thursday.',
      readBy: [priya._id],
    },
  ]);
  console.log(`Created ${msgs.length} messages`);

  // ── Notifications ──────────────────────────────────────────────────────────
  await Notification.create([
    { recipient: rohan._id, type: 'task_overdue', title: 'Task overdue: Finalize speaker list', body: 'This task was due May 8. Please complete ASAP.', link: '/tasks', priority: 'high', task: tasks[2]._id, event: techEvent._id },
    { recipient: sarah._id, type: 'task_completed', title: 'Task completed: Book venue', body: 'Completed by Ananya Patel', link: '/tasks', task: tasks[0]._id },
    { recipient: ananya._id, type: 'task_assigned', title: 'New task: Send participant invites', body: 'Assigned by Sarah Chen · Due May 10', link: '/tasks', task: tasks[3]._id },
    { recipient: priya._id, type: 'new_message', title: 'New message in Cultural Fest', body: 'Check latest updates', link: '/chat' },
    ...users.map(u => ({ recipient: u._id, type: 'admin_broadcast', title: 'Coordinators meeting tomorrow 10 AM', body: 'Room 204', link: '/', priority: 'high', sender: sarah._id, read: false })),
  ]);
  console.log('Created notifications');

  console.log('\n✅ Seed complete!');
  console.log('\nDemo login credentials:');
  console.log('  Admin:       admin@college.edu      / demo123');
  console.log('  Domain Head: domainhead@college.edu / demo123');
  console.log('  Event Head:  eventhead@college.edu  / demo123');
  console.log('  Others:      priya/karan/vivek@college.edu / demo123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
