# EventOps Platform — Internal Coordination System

EventOps is a premium, real-time collaboration and event-coordination system designed for college symposiums, fests, and department activities. It supports multi-level event scoping (Overall Events & Subevents), role-based task delegation, real-time channels, chronological timelines, shared files, and analytics.

---

## 🚀 Key Features

* **Multi-Level Event Scoping**: Upon log in, users must select an active **Overall Event** (e.g. *Symposium 2026*). The entire platform (sidebar, tasks, calendars, gantt, chat, documents) dynamically scopes itself to display only information and subevents relevant to that selected event.
* **Subevent Hierarchies**: Create multiple subevents (e.g. *Web Dev Hackathon*, *Coding Battle*) linked recursively to a parent Overall Event.
* **Role-Based Task Delegation**: Assign tasks to specific team members, track completions, and view overdue alerts.
* **Real-Time Communication**: Multi-channel event-specific chat rooms powered by Socket.io, with built-in natural language task detection.
* **Gantt & Calendar Visualizations**: View tasks on a calendar schedule or track team execution using Gantt bars.
* **Shared Documents Hub**: Secure file sharing and uploads supporting role-based and user-specific access control.
* **Analytics & Metrics**: Real-time progress bars, completion rates, and member activity charts built using Recharts.

---

## 🛠️ Technology Stack

### Frontend (`/react-app`)
* **Framework**: React.js (v18)
* **State Management**: 
  * `Zustand` (for persistent Auth session and Scoped Event context)
  * `@tanstack/react-query` (for API data synchronization and caching)
* **UI & Styling**: Custom Vanilla CSS with custom animations and glassmorphism.
* **Icons**: Fluent UI System Icons (`@fluentui/react-icons`)
* **Visualization**: `recharts` for progress bars and analytics charts.

### Backend (`/backend`)
* **Environment**: Node.js & Express
* **Database Object Modeling**: Mongoose (MongoDB)
* **Real-Time Communication**: Socket.io
* **Authentication**: JSON Web Token (JWT) with secure cookies and bcrypt hashing.

---

## 📂 Project Directory Structure

```text
EventOps-main/
├── backend/                  # Express Backend Service
│   ├── config/               # DB connection and seeder script (seed.js)
│   ├── models/               # Mongoose Schemas (User, Domain, Event, Task, Message)
│   ├── routes/               # Express Controllers (Auth, Events, Tasks, Chat, Documents)
│   ├── middleware/           # JWT and Permissions Checkers
│   ├── sockets/              # Socket.io event triggers
│   ├── server.js             # Main server entrypoint
│   └── package.json
│
├── react-app/                # React Single Page App
│   ├── public/               # Static assets (logo.png, index.html, favicon.ico)
│   ├── src/
│   │   ├── components/       # Shared UI (Layout, LoadingScreen, AIAssistant)
│   │   ├── pages/            # Core views (Dashboard, Events, Chat, Tasks, Gantt, etc.)
│   │   ├── store/            # Zustand global state stores (Auth, Event Context)
│   │   ├── hooks/            # Custom hooks (Socket, etc.)
│   │   ├── utils/            # Axios API wrappers and NLP utilities
│   │   └── index.js          # App mounting entrypoint
│   └── package.json
│
├── docker-compose.yml        # Development environment runner
└── render.yaml               # Cloud deployment config
```

---

## 💻 Getting Started (Local Run Guide)

Follow these steps to run the complete stack on your host machine:

### 1. Start Database Container
Boot up the MongoDB local Docker instance:
```bash
docker compose up mongo -d
```

### 2. Seed Clean Database
Wipe all tables and seed the main admin account (`admin@college.edu` / `demo123`) and default domains (**Technical, Cultural, Sports, Fest**):
```bash
cd backend
npm run seed
```

### 3. Start Backend Dev Server
Install dependencies and run node server locally on port `5000`:
```bash
cd backend
npm install
npm run dev
```

### 4. Start Frontend React Server
Install dependencies and run the webpack server locally on port `3000`:
```bash
cd react-app
npm install
npm start
```
Go to `http://localhost:3000` in your browser.

---

## ☁️ Deployment Configuration

The application is prepared for deployment on **Render** (via [render.yaml](file:///d:/Projects/EventOps-main/render.yaml)) supporting:
* **Node Dependency Override**: Forces installation of development tooling (`--production=false`) required to build Webpack.
* **Webpack Memory Optimizations**: Disables heavy Source-Map files (`GENERATE_SOURCEMAP=false`) preventing compilation crashes on free instances.
