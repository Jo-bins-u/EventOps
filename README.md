# EventOps Platform

**Event Operations & Coordination Platform** — an internal full-stack web application for managing college/organization event planning, team coordination, and workflow tracking.

---

## Features

- **Role-Based Access Control (RBAC)** — Admin, Domain Head, Event Head, Student Rep, Volunteer
- **JWT Authentication** — secure login with college email or ID
- **Domain & Event Management** — create domains, events, assign heads and members
- **Real-Time Chat** — WebSocket-powered group chats per event/domain, admin broadcast channel
- **Smart Chat → Task Conversion** — NLP keyword detection converts messages into tasks, reminders, or calendar events
- **Task Management** — create, assign, track tasks with deadlines, priorities, and statuses
- **Calendar View** — visualize tasks and events by date
- **Gantt Chart** — interactive task timeline with status color coding
- **Analytics Dashboard** — completion rates, member activity, event progress charts
- **Document Management** — upload files to Cloudinary with role/user-based access control
- **Notification System** — real-time bell notifications via WebSocket + email digests
- **Standalone HTML Prototype** — fully interactive UI demo, no backend needed

---

## Project Structure

```
eventops/
├── eventops-prototype.html      # Standalone interactive UI prototype
├── docker-compose.yml           # Full stack local dev with Docker
├── backend/                     # Node.js + Express + MongoDB API
│   ├── server.js                # Entry point (Express + Socket.io)
│   ├── .env.example             # Environment variable template
│   ├── Dockerfile
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── seed.js              # Demo data seeder
│   ├── middleware/
│   │   ├── auth.js              # JWT auth + RBAC guards
│   │   ├── upload.js            # Multer + Cloudinary
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Domain.js
│   │   ├── Event.js
│   │   ├── Task.js
│   │   ├── Message.js           # ChatRoom + Message
│   │   └── Notification.js      # Notification + Document
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── domains.js
│   │   ├── events.js
│   │   ├── tasks.js
│   │   ├── chat.js
│   │   ├── notifications.js
│   │   ├── documents.js
│   │   └── analytics.js
│   └── sockets/
│       ├── socketHandlers.js    # Socket.io event handlers
│       └── notifyHelper.js      # DB + socket notification helper
└── react-app/                   # React 18 frontend
    ├── package.json
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── App.jsx              # Routes
        ├── index.js             # Entry + providers
        ├── index.css            # Global styles + CSS variables
        ├── components/
        │   └── Layout.jsx       # Sidebar + topbar shell
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── Dashboard.jsx
        │   ├── DomainsPage.jsx
        │   ├── EventsPage.jsx
        │   ├── EventDetailPage.jsx
        │   ├── ChatPage.jsx
        │   ├── TasksPage.jsx
        │   ├── CalendarPage.jsx
        │   ├── GanttPage.jsx
        │   ├── AnalyticsPage.jsx
        │   ├── DocumentsPage.jsx
        │   ├── NotificationsPage.jsx
        │   ├── UsersPage.jsx
        │   ├── ProfilePage.jsx
        │   └── NotFoundPage.jsx
        ├── store/
        │   ├── authStore.js     # Zustand auth state
        │   └── notifStore.js    # Zustand notifications state
        ├── hooks/
        │   └── useSocket.js     # Socket.io client hook
        └── utils/
            ├── api.js           # Axios instance with interceptors
            └── nlp.js           # Rule-based NLP for chat extraction
```

---

## Quick Start

### Option 1 — Docker (recommended)

```bash
git clone <your-repo>
cd eventops

# Copy and fill in env vars
cp backend/.env.example backend/.env

# Start everything
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2 — Manual

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary keys
npm run seed           # seed demo data
npm run dev            # starts on port 5000
```

**Frontend**
```bash
cd react-app
npm install
npm start              # starts on port 3000
```

---

## Demo Credentials (after seeding)

| Role         | Email                       | Password  |
|--------------|-----------------------------|-----------|
| Admin        | admin@college.edu           | demo123   |
| Domain Head  | domainhead@college.edu      | demo123   |
| Event Head   | eventhead@college.edu       | demo123   |
| Student Rep  | vivek@college.edu           | demo123   |
| Volunteer    | karan@college.edu           | demo123   |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable                  | Description                        |
|---------------------------|------------------------------------|
| `MONGO_URI`               | MongoDB connection string          |
| `JWT_SECRET`              | Secret for signing JWTs            |
| `JWT_EXPIRES_IN`          | Token expiry e.g. `24h`            |
| `JWT_REFRESH_SECRET`      | Secret for refresh tokens          |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name              |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret              |
| `SMTP_HOST`               | Email SMTP host                    |
| `SMTP_USER`               | Email address                      |
| `SMTP_PASS`               | Email app password                 |
| `CLIENT_URL`              | Frontend URL for CORS              |

---

## API Reference

### Auth
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/auth/login       | Login, get JWT       |
| POST   | /api/auth/register    | Register new user    |
| POST   | /api/auth/refresh     | Refresh access token |
| GET    | /api/auth/me          | Get current user     |
| POST   | /api/auth/logout      | Logout               |

### Events
| Method | Endpoint                  | Permission       |
|--------|---------------------------|------------------|
| GET    | /api/events               | Authenticated    |
| POST   | /api/events               | CREATE_EVENT     |
| GET    | /api/events/:id           | Authenticated    |
| PATCH  | /api/events/:id           | CREATE_EVENT     |
| DELETE | /api/events/:id           | CREATE_EVENT     |
| POST   | /api/events/:id/members   | MANAGE_DOMAIN    |

### Tasks
| Method | Endpoint                  | Permission       |
|--------|---------------------------|------------------|
| GET    | /api/tasks                | Authenticated    |
| POST   | /api/tasks                | ASSIGN_TASK      |
| PATCH  | /api/tasks/:id            | Authenticated    |
| DELETE | /api/tasks/:id            | DELETE_CONTENT   |

### Chat
| Method | Endpoint                          | Description          |
|--------|-----------------------------------|----------------------|
| GET    | /api/chat/rooms                   | Get user's rooms     |
| GET    | /api/chat/rooms/:id/messages      | Get room messages    |
| POST   | /api/chat/rooms/:id/messages      | Send message         |
| PATCH  | /api/chat/messages/:id/pin        | Pin/unpin message    |
| PATCH  | /api/chat/messages/:id/star       | Star/unstar message  |

### Analytics
| Method | Endpoint                      | Permission       |
|--------|-------------------------------|------------------|
| GET    | /api/analytics/overview       | VIEW_ANALYTICS   |
| GET    | /api/analytics/events         | VIEW_ANALYTICS   |
| GET    | /api/analytics/members        | VIEW_ANALYTICS   |
| GET    | /api/analytics/gantt/:eventId | VIEW_ANALYTICS   |
| GET    | /api/analytics/timeline       | VIEW_ANALYTICS   |

---

## WebSocket Events

| Event            | Direction       | Description                        |
|------------------|-----------------|------------------------------------|
| `join:room`      | Client → Server | Join a chat room                   |
| `leave:room`     | Client → Server | Leave a chat room                  |
| `chat:message`   | Both            | New chat message                   |
| `chat:typing`    | Both            | Typing indicator                   |
| `chat:read`      | Both            | Mark messages as read              |
| `task:updated`   | Server → Client | Task status changed                |
| `notification`   | Server → Client | New notification                   |
| `admin:broadcast`| Client → Server | Admin sends broadcast (admin only) |

---

## Role Permissions

| Permission       | Admin | Domain Head | Event Head | Student Rep | Volunteer |
|------------------|-------|-------------|------------|-------------|-----------|
| CREATE_EVENT     | ✓     | ✓           |            |             |           |
| ASSIGN_TASK      | ✓     | ✓           | ✓          |             |           |
| VIEW_ANALYTICS   | ✓     | ✓           | ✓          |             |           |
| MANAGE_USERS     | ✓     |             |            |             |           |
| UPLOAD_DOCS      | ✓     | ✓           | ✓          | ✓           |           |
| BROADCAST        | ✓     |             |            |             |           |
| MANAGE_DOMAIN    | ✓     | ✓           |            |             |           |
| DELETE_CONTENT   | ✓     |             |            |             |           |

---

## Tech Stack

**Frontend:** React 18, React Router 6, Zustand, TanStack Query, Socket.io-client, Recharts, date-fns

**Backend:** Node.js, Express, MongoDB + Mongoose, Socket.io, JWT, bcryptjs, Multer + Cloudinary, Nodemailer

**Dev:** Docker, nodemon, ESLint
