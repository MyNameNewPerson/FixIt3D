@echo off
echo Starting the FixIt3D server...
echo You can access the website at http://localhost:3001

start cmd /c "timeout /t 5 /nobreak > nul && start http://localhost:3001"
npm run dev
