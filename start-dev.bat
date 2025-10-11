@echo off
echo Stopping any existing processes on port 3000...

REM Kill any processes using port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)

REM Wait a moment for the port to be released
timeout /t 2 /nobreak > nul

echo Starting development server on port 3000...
npm run dev
