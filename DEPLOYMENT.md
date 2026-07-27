# EventOps Platform — Production Deployment Guide

This guide describes how to configure, build, and deploy the EventOps platform in a production environment. 

Two deployment patterns are supported:
1. **Single-Server Unified Deployment (PaaS)** — React frontend built and served directly by the Node/Express backend. Ideal for Render, Heroku, Railway, etc.
2. **Multi-Container Docker Deployment** — Separate backend, database, and an Nginx static web server serving the frontend and reverse-proxying requests. Ideal for VMs/cloud instances (AWS, GCP, DigitalOcean).

---

## 🔑 Environment Variables Configuration

Both deployment configurations require setting environment variables for the Node.js backend. In production, these should be configured via your hosting provider's dashboard or a `.env` file on your server:

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Environment name (set to `production`) | `production` |
| `PORT` | Port for the Express server to listen on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/eventops` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | *Generate a strong secret key* |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens | *Generate a strong secret key* |
| `JWT_EXPIRES_IN` | Token duration | `24h` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token duration | `7d` |
| `GEMINI_API_KEY` | Google Gemini AI API key | *Optional (for AI assistant features)* |
| `GROQ_API_KEY` | Groq AI API key | *Optional (alternative AI models)* |
| `SUPABASE_URL` | Supabase endpoint | *Optional (for file uploads storage)* |
| `SUPABASE_KEY` | Supabase API key | *Optional (for file uploads storage)* |
| `SMTP_HOST` | Outgoing email server | *Optional (for email notifications)* |
| `SMTP_PORT` | Outgoing email port | *Optional* |
| `SMTP_USER` | Email username | *Optional* |
| `SMTP_PASS` | Email password | *Optional* |

---

## 🚀 Option 1: Single-Server Unified Deployment (Recommended for PaaS)

In this deployment strategy, the React frontend is compiled into static assets, and the Express backend is configured to serve them directly.

### 📦 Step 1: Build the React Frontend
Navigate to the `react-app` directory, install dependencies, and build the project:
```bash
cd react-app
npm install --legacy-peer-deps
npm run build
```
This generates a production-optimized build directory at `react-app/build`.

### ⚙️ Step 2: Configure and Start the Backend
Navigate to the `backend` directory, install production dependencies, and run the server:
```bash
cd ../backend
npm install --production --legacy-peer-deps

# Run database seeder (Optional, drops and seeds database with initial demo data)
NODE_ENV=production node config/seed.js

# Start the application server
NODE_ENV=production PORT=8080 node server.js
```
The server will now be listening on port `8080` (or whichever port you specify). It will handle:
- All API requests at `/api/*`
- All WebSocket connections at `/socket.io/*`
- Serving the React client code on `/` and resolving other URL requests using React client-side routing.

---

## 🐳 Option 2: Multi-Container Docker Deployment

This setup orchestrates MongoDB, Node.js backend, and Nginx using Docker Compose. Nginx acts as a high-performance static server for React assets and handles reverse-proxying of API and WebSockets.

### 🏗️ Step 1: Configure environment variables
Ensure any secret values are updated in `docker-compose.prod.yml` or set in a `.env` file at the root.

### ⚡ Step 2: Build and start the containers
Run the following command at the root of the project:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This command:
1. Starts the MongoDB database service.
2. Builds the lightweight backend production image from `backend/Dockerfile.prod` and starts the service.
3. Builds the multi-stage frontend production image from `react-app/Dockerfile.prod` (which builds the React bundle and runs Nginx) and maps Nginx's port `80` to the host's port `80`.

### 📝 Step 3: Seed mock database data
If you need the default system data (roles, admins, demo tasks), seed the running container:
```bash
docker exec -it eventops-backend-prod node config/seed.js
```

The application is now accessible at `http://YOUR_SERVER_IP` (Port `80`).

---

## 🔒 Production Security Checklist

1. **Change JWT Secrets**: Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are long, random strings and not the default values.
2. **Enable HTTPS / SSL**: Configure SSL certificates (e.g., using Let's Encrypt / Certbot) on your Nginx server or PaaS load balancer.
3. **Database Security**: Never expose port `27017` on public interfaces. If running Option 2, MongoDB is only reachable within the internal Docker bridge network (`eventops-mongo-prod`).
