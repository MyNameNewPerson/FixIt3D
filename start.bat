@echo off
:: Set UTF-8 encoding for CMD
chcp 65001 >nul
setlocal enabledelayedexpansion
title FixIt3D Launcher

echo ===================================================
echo   FixIt3D - Jules Version (Final Edition)
echo ===================================================
echo.

:: 1. Check for Node.js
echo [1/5] Проверка Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [CRITICAL ERROR] Node.js не найден.
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    pause
    exit /b
)

:: 2. Check for package.json
echo [2/5] Проверка файлов проекта...
if not exist "package.json" (
    echo [CRITICAL ERROR] Файл package.json не найден.
    echo Запустите этот файл в папке с проектом.
    pause
    exit /b
)

:: 3. Install dependencies
echo [3/5] Проверка зависимостей...
if not exist "node_modules\" (
    echo [INFO] Установка зависимостей (это может занять минуту)...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Ошибка при установке зависимостей.
        pause
        exit /b
    )
)

:: 4. Port cleanup
echo [4/5] Освобождение порта 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Освобождение порта (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

:: 5. Launch
echo [5/5] Запуск сервера...
start cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3000"

echo.
echo [SUCCESS] Сервер запускается на http://localhost:3000
echo ---------------------------------------------------
echo Нажмите Ctrl+C для остановки.
echo ---------------------------------------------------

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Произошла ошибка при работе сервера.
)

echo.
echo [INFO] Нажмите любую клавишу для выхода.
pause
endlocal
