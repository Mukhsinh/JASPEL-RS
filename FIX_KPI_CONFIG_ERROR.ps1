Write-Host "🔧 FIXING KPI CONFIG ERROR 500" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Kill all node processes
Write-Host "1️⃣ Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Node processes stopped`n" -ForegroundColor Green

# Step 2: Clear Next.js cache
Write-Host "2️⃣ Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ .next folder deleted" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next folder not found" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Verify all checks pass
Write-Host "3️⃣ Running diagnostics..." -ForegroundColor Yellow
npx tsx scripts/check-kpi-config-error.ts
Write-Host ""

# Step 4: Start dev server
Write-Host "4️⃣ Starting dev server..." -ForegroundColor Yellow
Write-Host "⏳ Please wait for server to start...`n" -ForegroundColor Gray

$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1
}

# Wait for server
Start-Sleep -Seconds 12

# Step 5: Test server is running
Write-Host "5️⃣ Testing server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Server is running (Status: $($response.StatusCode))`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Server might still be starting...`n" -ForegroundColor Yellow
}

# Step 6: Open browser
Write-Host "6️⃣ Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:3002/login"

Write-Host "`n✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`n📝 Instructions:" -ForegroundColor Yellow
Write-Host "   1. Login dengan: mukhsin9@gmail.com / admin123" -ForegroundColor White
Write-Host "   2. Setelah login, klik menu 'Konfigurasi KPI'" -ForegroundColor White
Write-Host "   3. Jika masih error 500:" -ForegroundColor White
Write-Host "      - Tekan Ctrl+Shift+R untuk hard refresh" -ForegroundColor White
Write-Host "      - Atau buka Incognito/Private window" -ForegroundColor White
Write-Host "`n⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Keep running
Wait-Job $job
