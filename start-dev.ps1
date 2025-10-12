# FieldTrack Development Server Startup Script
# This ensures consistent development environment

Write-Host "Starting FieldTrack Development Server..." -ForegroundColor Green
Write-Host "Database: Neon DB (shared with production)" -ForegroundColor Yellow
Write-Host "Storage: Vercel Blob" -ForegroundColor Yellow
Write-Host "Port: 3002" -ForegroundColor Yellow
Write-Host ""

# Kill any existing Node processes to avoid port conflicts
Write-Host "Cleaning up existing processes..." -ForegroundColor Blue
taskkill /f /im node.exe 2>$null

# Remove Next.js cache to ensure clean build
Write-Host "Clearing Next.js cache..." -ForegroundColor Blue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start Vercel dev server
Write-Host "Starting Vercel dev server on port 3000..." -ForegroundColor Green
Write-Host "Access your app at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

vercel dev --listen 3000