# PERBAIKI ASSESSMENT ACCESS - Quick Fix
# Mengatasi masalah 403 Forbidden pada halaman penilaian KPI

Write-Host "🔧 PERBAIKI AKSES HALAMAN ASSESSMENT" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n1. Restart development server..." -ForegroundColor Yellow
# Stop existing dev server if running
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Next.js cache
Write-Host "2. Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# Start fresh dev server
Write-Host "3. Starting fresh development server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Minimized

# Wait for server to start
Write-Host "4. Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n✅ LANGKAH SELANJUTNYA:" -ForegroundColor Green
Write-Host "1. Buka browser baru atau mode incognito" -ForegroundColor White
Write-Host "2. Buka http://localhost:3002" -ForegroundColor White
Write-Host "3. Login dengan akun superadmin:" -ForegroundColor White
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor Cyan
Write-Host "4. Setelah login, navigasi ke:" -ForegroundColor White
Write-Host "   http://localhost:3002/assessment" -ForegroundColor Cyan
Write-Host "5. Jika masih error 403, tekan F12 dan cek Network tab" -ForegroundColor White

Write-Host "`n🎯 JIKA MASIH BERMASALAH:" -ForegroundColor Yellow
Write-Host "- Clear cookies dan cache browser" -ForegroundColor White
Write-Host "- Logout dan login ulang" -ForegroundColor White
Write-Host "- Coba route admin lain dulu (/dashboard, /units)" -ForegroundColor White

Write-Host "`n✅ Script selesai! Server berjalan di background." -ForegroundColor Green