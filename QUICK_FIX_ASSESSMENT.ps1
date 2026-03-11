
# QUICK FIX ASSESSMENT ACCESS
Write-Host "🔧 Memperbaiki akses assessment..." -ForegroundColor Green

# Stop dev server
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear cache
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

# Start server
Write-Host "Starting server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Minimized

Write-Host "✅ Server restarted. Tunggu 10 detik lalu coba akses:" -ForegroundColor Green
Write-Host "   http://localhost:3002/assessment" -ForegroundColor Cyan
