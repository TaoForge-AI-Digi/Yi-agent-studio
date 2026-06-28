@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo === Yi Agent Studio ===
echo.

echo [1/2] Starting Yi Server (port 3001)...
start "Yi Server" cmd /c "cd /d apps\server && npx tsx src\index.ts"

echo [2/2] Starting Yi Client (port 5173)...
cd apps\client
npx vite --open

pause
