Write-Host "🚀 Starting Sandbox Environment..." -ForegroundColor Cyan

# Check if Docker is running
if (!(Get-Process docker -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Docker is not running. Please start Docker Desktop first." -ForegroundColor Yellow
    exit
}

# 1. Start Infrastructure
Write-Host "1. Starting Docker Containers (DB, Redis, MinIO)..." -ForegroundColor Green
docker-compose up -d

# 2. Start Backend
Write-Host "2. Starting Backend Server..." -ForegroundColor Green
$backendCmd = "cd backend; if (Test-Path ..\.venv) { ..\.venv\Scripts\activate; uvicorn app.main:app --reload } else { Write-Host 'Virtual environment not found in root!' -ForegroundColor Red }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$backendCmd"

# 3. Start Frontend
Write-Host "3. Starting Frontend Dashboard..." -ForegroundColor Green
$frontendCmd = "cd frontend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$frontendCmd"

Write-Host "✅ All services started!" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:8000"
Write-Host "   - Dashboard: http://localhost:5173"
Write-Host "   - Docs: http://localhost:8000/docs"
Write-Host "   - MinIO: http://localhost:9001 (user/password)"
