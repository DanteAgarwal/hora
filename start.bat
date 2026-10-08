@echo off
echo ========================================================
echo   Starting Kundli Workbench (Hora End-to-End System)
echo ========================================================
echo.

set PYTHONUTF8=1

echo [1/2] Starting Python FastAPI Hora Engine on port 8000...
start "Hora Python Engine (Port 8000)" cmd /k ".venv\Scripts\python.exe -m uvicorn hora.api.main:app --port 8000"

timeout /t 2 >nul

echo [2/2] Starting Node.js Middleware and Web Server on port 4000...
start "Kundli Workbench Server (Port 4000)" cmd /k "node server\index.js"

echo.
echo ========================================================
echo   System running!
echo   - Web UI and API Gateway: http://localhost:4000
echo   - Python Engine API:      http://localhost:8000
echo   - Python API Docs:        http://localhost:8000/docs
echo ========================================================
echo.
