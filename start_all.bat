@echo off
title Sandbox Orchestration Starter
echo ===================================================
echo     Starting Sandbox Analysis Environment (Prod)
echo ===================================================
echo.

echo [1/4] Starting Redis (Message Broker)...
:: Assumes Redis is installed via WSL or native Windows port in background
:: For local dev, we'll try to start via WSL if available
start "Redis Server" cmd /k "wsl redis-server"
timeout /t 2 /nobreak >nul

echo [2/4] Starting Celery Worker (Task Queue)...
cd backend
start "Celery Worker" cmd /k ".\.venv\Scripts\celery.exe -A app.worker.celery_app worker -l INFO -P solo"
cd ..
timeout /t 3 /nobreak >nul

echo [3/4] Starting FastAPI Backend Server...
cd backend
start "FastAPI Backend" cmd /k ".\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000"
cd ..
timeout /t 3 /nobreak >nul

echo [4/4] Starting React Frontend...
cd frontend
start "React Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo  All services have been initiated in new windows!
echo  Access the Dashboard at: http://localhost:5173
echo ===================================================
pause
