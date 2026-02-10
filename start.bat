@echo off
TITLE FixIt3D Launcher
echo Starting FixIt3D...
node launcher.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Launcher failed to start.
    echo Please make sure Node.js is installed.
    pause
)
