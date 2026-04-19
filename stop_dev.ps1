Write-Host "🛑 Shutting down Sandbox Environment..." -ForegroundColor Yellow

# 1. Stop Docker Infrastructure
Write-Host "1. Stopping Docker Containers..." -ForegroundColor Cyan
docker-compose down

# 2. Kill Node (Frontend) and Python (Backend/Celery)
Write-Host "2. Terminating Frontend and Backend processes..." -ForegroundColor Cyan
taskkill /F /IM node.exe /T 2>$null
taskkill /F /IM python.exe /T 2>$null

Write-Host "✅ All Sandbox services have been stopped!" -ForegroundColor Green
