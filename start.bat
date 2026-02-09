@echo off
setlocal
echo ===================================================
echo   FixIt3D - Jules Version Launcher
echo ===================================================

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js не найден! Пожалуйста, установите Node.js с https://nodejs.org/
    pause
    exit /b
)

:: Check for node_modules
if not exist "node_modules\" (
    echo [INFO] Установка зависимостей (npm install)... Это может занять минуту.
    call npm install
)

:: Kill existing processes on port 3000
echo [INFO] Очистка порта 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo [INFO] Завершение процесса PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

set PORT=3000
echo [SUCCESS] Запуск сервера на http://localhost:3000
echo [INFO] Если браузер не откроется сам, перейдите по ссылке вручную.

:: Start browser with a slight delay
start cmd /c "timeout /t 5 /nobreak > nul && start http://localhost:3000"

:: Run server
npm run dev

endlocal
