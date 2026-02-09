@echo off
setlocal enabledelayedexpansion
title FixIt3D Launcher

echo ===================================================
echo   FixIt3D - Jules Version (Final Edition)
echo ===================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Node.js не найден.
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    echo Это необходимо для работы сервера.
    pause
    exit /b
)

:: 2. Install dependencies if node_modules missing
if not exist "node_modules\" (
    echo [INFO] Первый запуск: устанавливаем зависимости...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Не удалось установить зависимости. Проверьте интернет-соединение.
        pause
        exit /b
    )
)

:: 3. Clean port 3000
echo [INFO] Подготовка порта 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo [INFO] Завершение старого процесса (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

:: 4. Start the browser automatically
echo [INFO] Открываем браузер...
start cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

:: 5. Launch the server
echo [SUCCESS] Сервер запускается на http://localhost:3000
echo Нажмите Ctrl+C для остановки.
echo ===================================================
npm run dev

endlocal
