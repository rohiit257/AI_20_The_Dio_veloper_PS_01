@echo off
echo Starting AI Avatar Assistant...
echo.

echo [1/2] Starting Backend...
start cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo All components started! 
echo Backend URL: http://localhost:5001
echo Frontend URL: http://localhost:3000
echo.
echo Press any key to exit this window (services will continue running)
pause > nul 