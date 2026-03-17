Write-Host "🔄 Restarting Development Server..." -ForegroundColor Cyan

# Kill existing Next.js process
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "✅ Server stopped" -ForegroundColor Green

# Clear Next.js cache
Write-Host "🧹 Clearing cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "✅ Server should be ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test Steps:" -ForegroundColor Cyan
Write-Host "1. Open browser: http://localhost:3002/login" -ForegroundColor White
Write-Host "2. Login dengan:" -ForegroundColor White
Write-Host "   Email: admin@jaspel.com" -ForegroundColor Yellow
Write-Host "   Password: Admin123!" -ForegroundColor Yellow
Write-Host "3. Dashboard seharusnya tampil tanpa error 500" -ForegroundColor White
Write-Host "4. Check console log di browser (F12)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Expected Results:" -ForegroundColor Cyan
Write-Host "   - Dashboard loads successfully" -ForegroundColor Green
Write-Host "   - Stats cards show: 4 employees, 33 units" -ForegroundColor Green
Write-Host "   - Charts may be empty (no assessment data yet)" -ForegroundColor Yellow
Write-Host "   - No 500 Internal Server Error" -ForegroundColor Green
Write-Host ""

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:3002/login"

Write-Host "✅ Browser opened. Please test the dashboard!" -ForegroundColor Green
