@echo off
echo === EventOps Platform - Status Check ===
echo.

echo --- Running Containers ---
docker ps
echo.

echo --- Frontend Logs (last 30 lines) ---
docker logs eventops-frontend --tail 30
echo.

echo --- Backend Logs (last 20 lines) ---
docker logs eventops-backend --tail 20
echo.

echo --- Port Check ---
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5000"
echo.
pause
