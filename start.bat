@echo off
echo Starting the FixIt3D server (Jules Version)...
echo Stopping any existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
echo You can access the website at http://localhost:3000

set PORT=3000
start cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"
npm run dev
