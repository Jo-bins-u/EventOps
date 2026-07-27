# Running EventOps on Windows

## Quick Start (Recommended)

Double-click **`start-windows.bat`** — it does everything automatically.

Or run manually in Command Prompt:

```cmd
docker compose down
docker compose build --no-cache
docker compose up -d
timeout /t 15
docker exec eventops-backend node config/seed.js
```

Then open http://localhost:3000

---

## Demo Login Credentials

| Role        | Email                       | Password |
|-------------|-----------------------------|----------|
| Admin       | admin@college.edu           | demo123  |
| Domain Head | domainhead@college.edu      | demo123  |
| Event Head  | eventhead@college.edu       | demo123  |
| Volunteer   | karan@college.edu           | demo123  |

---

## Windows-Specific Notes

### Commands that DON'T work on Windows CMD:
```bash
# Linux/Mac only - DON'T USE these:
docker rmi image 2>/dev/null || true
```

### Windows equivalents:
```cmd
# Remove image (ignores error if not found):
docker rmi image-name 2>nul

# Check running containers:
docker ps

# View frontend logs:
docker logs eventops-frontend

# View backend logs:
docker logs eventops-backend

# Stop everything:
docker compose down

# Restart just frontend:
docker compose restart frontend

# Rebuild just frontend after code changes:
docker compose build frontend
docker compose up -d frontend
```

---

## Troubleshooting

### Frontend taking too long to start
```cmd
docker logs eventops-frontend
```
Wait up to 3 minutes on first run — React compiles on startup.

### Backend not connecting to MongoDB
```cmd
docker logs eventops-backend
```
Make sure mongo started first. If not:
```cmd
docker compose up mongo
timeout /t 5
docker compose up backend
timeout /t 5
docker compose up frontend
```

### Port already in use
```cmd
docker compose down
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```
Then kill the PID shown, or change ports in docker-compose.yml.

### Complete clean reset
```cmd
docker compose down
docker system prune -f
docker compose build --no-cache
docker compose up -d
```

### Seed fails (database already has data)
```cmd
docker exec eventops-backend node config/seed.js
```
The seed script wipes and re-creates all demo data automatically.
