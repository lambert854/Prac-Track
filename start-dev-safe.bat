@echo off
echo 🚀 Starting Prac-Track Development Server...

echo 🔧 Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo    Killed process %%a
)

echo 🧹 Clearing Next.js cache...
if exist .next (
    rmdir /s /q .next >nul 2>&1
    echo    Cache cleared
)

echo 🔑 Setting environment variables...
set NEXTAUTH_SECRET=local-development-secret-change-in-production
set NEXTAUTH_URL=http://localhost:3000

echo ▶️  Starting server on port 3000...
npm run dev
