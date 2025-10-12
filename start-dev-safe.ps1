# Safe development server startup script
Write-Host "🚀 Starting Prac-Track Development Server..." -ForegroundColor Green

# Kill any processes using port 3000
Write-Host "🔧 Clearing port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes) {
    $processes | ForEach-Object { 
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        Write-Host "   Killed process $_" -ForegroundColor Red
    }
}

# Clear Next.js cache
Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Cache cleared" -ForegroundColor Green
}

# Set environment variables
Write-Host "🔑 Setting environment variables..." -ForegroundColor Yellow
$env:NEXTAUTH_SECRET = "local-development-secret-change-in-production"
$env:NEXTAUTH_URL = "http://localhost:3000"

# Start the development server
Write-Host "▶️  Starting server on port 3000..." -ForegroundColor Green
npm run dev
