const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { authenticate } = require('../middleware/auth');
const Domain = require('../models/Domain');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { Notification, Document } = require('../models/Notification');
const { ChatRoom } = require('../models/Message');

// Bypass SSL certificate verification for local development network blocks (e.g. proxy/security interception)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

router.use(authenticate);

// In-memory chat history mapping userId -> Array of messages
// Each message has format: { role: 'user'|'assistant', content: string }
const chatHistories = new Map();

// Helper to compile DB context based on user role
const buildContext = async (user) => {
  const context = {
    currentUser: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    systemTime: new Date().toISOString(),
  };

  try {
    if (user.role === 'admin') {
      const [domains, events, tasks, docs, chatRooms] = await Promise.all([
        Domain.find({}, 'name description head status'),
        Event.find({}, 'name description domain eventHead startDate endDate venue status budget'),
        Task.find({}, 'title description event assignedTo dueDate status priority'),
        Document.find({}, 'name url'),
        ChatRoom.find({}, 'name type event domain'),
      ]);

      context.domains = domains;
      context.events = events;
      context.tasks = tasks;
      context.documentsCount = docs.length;
      context.chatRooms = chatRooms;
    } else {
      // Find domains where user is head or member
      const userDomains = await Domain.find({
        $or: [{ head: user._id }, { members: user._id }],
      }, 'name description head status');
      context.myDomains = userDomains;

      const userDomainIds = userDomains.map(d => d._id);

      // Find events where user is head, member, or domain matches user's domains
      const userEvents = await Event.find({
        $or: [
          { eventHead: user._id },
          { members: user._id },
          { domain: { $in: userDomainIds } }
        ]
      }, 'name description domain eventHead startDate endDate venue status budget');
      context.myEvents = userEvents;

      const userEventIds = userEvents.map(e => e._id);

      // Find tasks assigned to, created by, or belonging to user's events
      const userTasks = await Task.find({
        $or: [
          { assignedTo: user._id },
          { createdBy: user._id },
          { event: { $in: userEventIds } }
        ]
      }, 'title description event assignedTo dueDate status priority');
      context.myTasks = userTasks;

      // Find chat rooms user is a member of
      const userChatRooms = await ChatRoom.find({
        members: user._id
      }, 'name type event domain');
      context.myChatRooms = userChatRooms;
    }
  } catch (err) {
    console.error('Error compiling AI context:', err);
    context.error = 'Failed to load database records. Context might be incomplete.';
  }

  return context;
};

// GET /api/ai/history - Get user's active session history
router.get('/history', (req, res) => {
  const history = chatHistories.get(req.user._id.toString()) || [];
  res.json(history);
});

// POST /api/ai/reset - Reset user's session history
router.post('/reset', (req, res) => {
  chatHistories.delete(req.user._id.toString());
  res.json({ message: 'AI chat history reset successfully' });
});

// POST /api/ai/chat - Process user message with live context
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Graceful fallback if Groq Key is not set
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.json({
        reply: "⚠️ **Groq API Key is missing!**\n\nTo enable the AI Assistant, please set a valid `GROQ_API_KEY` in the backend `.env` file and restart the server.",
        actions: []
      });
    }

    // Compile latest DB context for user
    const dbContext = await buildContext(req.user);

    // Retrieve or initialize conversation history
    const userIdStr = req.user._id.toString();
    const history = chatHistories.get(userIdStr) || [];

    const systemPrompt = `
You are "EventOps AI", a context-aware smart assistant and coordinator for the EventOps platform.
You are chatting with ${req.user.name} who has the role "${req.user.role}".
The current system date/time is ${new Date().toISOString()}.

Here is the live database context of the platform relevant to the user:
${JSON.stringify(dbContext)}

Guidelines:
1. Base your answers strictly on the provided database context.
2. If the user asks about tasks, events, domains, or notifications, query the provided context to answer them.
3. Keep responses helpful, professional, and clear. Use markdown for formatting text inside the "reply" field. You MUST use literal newlines (\\n) to separate paragraphs, headings (e.g., ###), and list items (e.g., * or -) so they start on their own lines. Never group them into a single continuous line.
4. If the user asks you to create a task, or if they describe something that should be a task, recommend a "create_task" action.
5. If the user wants to go to a page (e.g., tasks, calendar, events, analytics, profile, documents, users & roles, domains), recommend a "navigate" action. If they refer to a specific event page, retrieve its _id from the context and set the path to "/events/:eventId" (replacing :eventId with the actual event ID).
6. If the user wants to send a message to a chat channel or room, or asks you to broadcast/message a team, recommend a "send_message" action with the appropriate "roomId" (matching a ChatRoom's _id from the context) and the "content" of the message.
7. ALWAYS respond with a JSON object matching this schema:
{
  "reply": "your text response in markdown formatting",
  "actions": [
    {
      "type": "create_task",
      "title": "Task title",
      "dueDate": "YYYY-MM-DD (estimate based on context or current date if unspecified)",
      "priority": "low|normal|high|critical",
      "eventId": "event ID from the context if referring to a specific event (must match a real Event _id)"
    },
    {
      "type": "navigate",
      "path": "/tasks|/calendar|/events|/events/:eventId|/analytics|/documents|/profile|/users|/domains"
    },
    {
      "type": "send_message",
      "roomId": "room ID from the context (must match a real ChatRoom _id)",
      "content": "message body to be sent"
    }
  ]
}
If no action is appropriate, the "actions" array should be empty. Do not return any text outside of the valid JSON object.
`;

    // Map messages payload for Groq chat completions
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log(`Sending prompt to Groq API via SDK for user ${req.user.name}...`);

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // Request completions
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0].message.content;

    let responseObj;
    try {
      responseObj = JSON.parse(rawResponse);
    } catch (parseErr) {
      console.error('Failed to parse Groq response as JSON:', rawResponse);
      responseObj = {
        reply: rawResponse,
        actions: []
      };
    }

    // Save updated history locally
    const updatedHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: rawResponse }
    ];

    // Prune history to last 20 messages if it gets too large
    if (updatedHistory.length > 20) {
      chatHistories.set(userIdStr, updatedHistory.slice(updatedHistory.length - 20));
    } else {
      chatHistories.set(userIdStr, updatedHistory);
    }

    res.json(responseObj);
  } catch (err) {
    console.error('Groq AI SDK Request Error:', err.message);
    res.status(500).json({ message: 'Error processing AI chat request', error: err.message });
  }
});

module.exports = router;
