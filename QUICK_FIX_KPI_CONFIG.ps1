Write-Host "🔧 QUICK FIX KPI CONFIG" -ForegroundColor Cyan
Write-Host "======================`n" -ForegroundColor Cyan

# Kill node processes
Write-Host "1️⃣ Stopping Node..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Done`n" -ForegroundColor Green

# Clear cache
Write-Host "2️⃣ Clearing cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cache cleared`n" -ForegroundColor Green
}

Write-Host "3️⃣ Now run: npm run dev" -ForegroundColor Yellow
Write-Host "4️⃣ Then open: http://localhost:3002/login" -ForegroundColor Yellow
Write-Host "5️⃣ Login: mukhsin9@gmail.com / admin123" -ForegroundColor Yellow
Write-Host "6️⃣ Go to Konfigurasi KPI menu" -ForegroundColor Yellow
Write-Host "`n⚠️  If still error 500, press Ctrl+Shift+R in browser`n" -ForegroundColor Red
