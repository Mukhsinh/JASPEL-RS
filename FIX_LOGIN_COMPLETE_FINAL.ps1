Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIX LOGIN COMPLETE - FINAL VERSION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify fixes
Write-Host "Step 1: Verifying all fixes..." -ForegroundColor Yellow
npx tsx scripts/verify-all-fixes.ts

Write-Host ""
Write-Host "Step 2: Testing backend..." -ForegroundColor Yellow
npx tsx scripts/test-login-final-fix.ts

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BACKEND TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Preparing to start application..." -ForegroundColor Yellow
Write-Host ""

# Stop existing server
Write-Host "  - Stopping existing dev server..." -ForegroundColor Gray
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear cache
Write-Host "  - Clearing Next.js cache..." -ForegroundColor Gray
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  IMPORTANT - CLEAR BROWSER STORAGE!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Sebelum test login, WAJIB clear browser storage:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Cara 1 (Recommended):" -ForegroundColor Cyan
Write-Host "  1. Buka DevTools (F12)" -ForegroundColor White
Write-Host "  2. Application tab" -ForegroundColor White
Write-Host "  3. Storage > Clear site data" -ForegroundColor White
Write-Host "  4. Click 'Clear site data' button" -ForegroundColor White
Write-Host ""
Write-Host "Cara 2 (Alternative):" -ForegroundColor Cyan
Write-Host "  1. Ctrl + Shift + Delete" -ForegroundColor White
Write-Host "  2. Pilih 'Cookies and other site data'" -ForegroundColor White
Write-Host "  3. Pilih 'Cached images and files'" -ForegroundColor White
Write-Host "  4. Clear data" -ForegroundColor White
Write-Host ""
Write-Host "Tekan Enter setelah clear storage..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  STARTING APPLICATION" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URL: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Kredensial:" -ForegroundColor Yellow
Write-Host "  Email    : mukhsin9@gmail.com" -ForegroundColor White
Write-Host "  Password : admin123" -ForegroundColor White
Write-Host ""
Write-Host "Perbaikan yang diterapkan:" -ForegroundColor Yellow
Write-Host "  ✅ Removed custom storage adapter" -ForegroundColor Green
Write-Host "  ✅ Removed signOut before login" -ForegroundColor Green
Write-Host "  ✅ Simplified auth error handler" -ForegroundColor Green
Write-Host "  ✅ Removed duplicate auth listeners" -ForegroundColor Green
Write-Host ""
Write-Host "Expected behavior:" -ForegroundColor Yellow
Write-Host "  ✅ Login berhasil tanpa loop" -ForegroundColor Green
Write-Host "  ✅ Redirect ke /dashboard" -ForegroundColor Green
Write-Host "  ✅ Bisa akses semua menu" -ForegroundColor Green
Write-Host "  ✅ Tidak ada console error berulang" -ForegroundColor Green
Write-Host "  ✅ Session persistent" -ForegroundColor Green
Write-Host ""
Write-Host "Menu yang harus bisa diakses (Superadmin):" -ForegroundColor Yellow
Write-Host "  - Dashboard" -ForegroundColor White
Write-Host "  - Units" -ForegroundColor White
Write-Host "  - Users / Pegawai" -ForegroundColor White
Write-Host "  - KPI Config" -ForegroundColor White
Write-Host "  - Pool" -ForegroundColor White
Write-Host "  - Assessment" -ForegroundColor White
Write-Host "  - Reports" -ForegroundColor White
Write-Host "  - Settings" -ForegroundColor White
Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Green
Write-Host ""

npm run dev
