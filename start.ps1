# PowerShell startup script for Hora Kundli Workbench
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Kundli Workbench (Hora End-to-End System)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$env:PYTHONUTF8 = "1"

Write-Host "[1/2] Starting Python FastAPI Hora Engine on port 8000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`$env:PYTHONUTF8='1'; .\.venv\Scripts\python.exe -m uvicorn hora.api.main:app --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Node.js Middleware & Web Server on port 4000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "node server\index.js"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  System running!" -ForegroundColor Green
Write-Host "  - Web UI & API Gateway: http://localhost:4000" -ForegroundColor White
Write-Host "  - Python Engine API:     http://localhost:8000" -ForegroundColor White
Write-Host "  - Python API Docs:       http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
