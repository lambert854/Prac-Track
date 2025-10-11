# PowerShell script to start dev server on port 3000
Write-Host "Stopping any existing processes on port 3000..." -ForegroundColor Yellow

# Get processes using port 3000
$processes = netstat -ano | Select-String ":3000.*LISTENING" | ForEach-Object {
    $parts = $_ -split '\s+'
    $parts[-1]
}

# Kill each process
foreach ($pid in $processes) {
    if ($pid -and $pid -ne "0") {
        Write-Host "Killing process $pid" -ForegroundColor Red
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Could not kill process $pid" -ForegroundColor Yellow
        }
    }
}

# Wait for port to be released
Start-Sleep -Seconds 2

Write-Host "Starting development server on port 3000..." -ForegroundColor Green
npm run dev
