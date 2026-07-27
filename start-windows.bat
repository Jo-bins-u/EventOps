@echo off
echo === EventOps Platform - Windows Setup ===
echo.

echo [1/5] Stopping old containers...
docker compose down 2>nul

echo [2/5] Removing old images...
for /f "tokens=*" %%i in ('docker images -q --filter "reference=*eventops*"') do docker rmi %%i 2>nul

echo [3/5] Building images (5-8 mins first time, please wait)...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED. Check errors above.
    pause
    exit /b 1
)

echo [4/5] Starting services...
docker compose up -d

echo [5/5] Waiting for everything to start...
echo  - MongoDB:  10s
timeout /t 10 /nobreak >nul
echo  - Backend:  20s more
timeout /t 20 /nobreak >nul
echo  - Frontend: 90s more (React compiling...)
timeout /t 90 /nobreak >nul

echo.
echo --- Container Status ---
docker ps
echo.

echo Seeding demo data...
docker exec eventops-backend node config/seed.js

echo.
echo =========================================
echo  Open: http://localhost:3000
echo  Login: admin@college.edu / demo123
echo =========================================
pause
