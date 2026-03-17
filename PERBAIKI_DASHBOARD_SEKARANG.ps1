# Perbaiki Dashboard Sekarang
# Script master untuk memperbaiki semua error dashboard

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PERBAIKAN DASHBOARD - JASPEL KPI    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Stop dev server jika running
Write-Host "1️⃣ Stopping dev server..." -ForegroundColor Yellow
$devProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node_modules*" }
if ($devProcess) {
    Stop-Process -Id $devProcess.Id -Force
    Write-Host "✅ Dev server stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  No dev server running" -ForegroundColor Gray
}

# 2. Jalankan perbaikan
Write-Host ""
Write-Host "2️⃣ Menjalankan perbaikan..." -ForegroundColor Yellow
.\FIX_DASHBOARD_ERRORS.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Perbaikan gagal!" -ForegroundColor Red
    Write-Host "   Cek error di atas dan coba lagi" -ForegroundColor Red
    exit 1
}

# 3. Restart dev server
Write-Host ""
Write-Host "3️⃣ Starting dev server..." -ForegroundColor Yellow
Write-Host "   Server akan berjalan di http://localhost:3002" -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ Tunggu hingga server siap (biasanya 10-15 detik)..." -ForegroundColor Yellow
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait for server to be ready
Write-Host "⏳ Menunggu server siap..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 307) {
            $serverReady = $true
        }
    } catch {
        # Server not ready yet
    }
    $attempt++
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""

if ($serverReady) {
    Write-Host "✅ Server siap!" -ForegroundColor Green
    
    # 4. Run tests
    Write-Host ""
    Write-Host "4️⃣ Running tests..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    .\TEST_DASHBOARD_FIX.ps1
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║         PERBAIKAN SELESAI! ✅          ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Langkah selanjutnya:" -ForegroundColor Cyan
    Write-Host "   1. Buka browser: http://localhost:3002" -ForegroundColor White
    Write-Host "   2. Login dengan akun superadmin" -ForegroundColor White
    Write-Host "   3. Dashboard seharusnya load tanpa error" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Yellow
    Write-Host "   - Jika masih ada error, clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
    Write-Host "   - Reload dengan Ctrl+F5 untuk hard refresh" -ForegroundColor Gray
    Write-Host "   - Cek console browser untuk error detail" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  Server belum siap setelah 30 detik" -ForegroundColor Yellow
    Write-Host "   Cek terminal dev server untuk error" -ForegroundColor Yellow
    Write-Host "   Atau tunggu beberapa detik lagi dan coba akses manual" -ForegroundColor Yellow
}
