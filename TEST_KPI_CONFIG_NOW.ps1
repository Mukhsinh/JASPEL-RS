Write-Host "🔄 Restarting dev server dan testing KPI Config..." -ForegroundColor Cyan

# Kill existing process
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Start dev server in background
Write-Host "`n📦 Starting dev server..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test authentication
Write-Host "`n🔐 Testing authentication..." -ForegroundColor Cyan
npx tsx scripts/verify-auth-complete.ts

# Open browser to KPI Config page
Write-Host "`n🌐 Opening browser to KPI Config page..." -ForegroundColor Green
Start-Process "http://localhost:3002/kpi-config"

Write-Host "`n✅ Server is running. Check browser for KPI Config page." -ForegroundColor Green
Write-Host "📝 Login dengan: mukhsin9@gmail.com / admin123" -ForegroundColor Yellow
Write-Host "`n⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Keep script running
Wait-Job $job
