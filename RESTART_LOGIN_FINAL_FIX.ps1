Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTART APLIKASI - LOGIN FINAL FIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any running dev server
Write-Host "1. Stopping existing dev server..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "2. Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   Cache cleared" -ForegroundColor Green
}

# Clear browser storage instruction
Write-Host ""
Write-Host "3. PENTING - Clear browser storage:" -ForegroundColor Red
Write-Host "   a. Buka DevTools (F12)" -ForegroundColor White
Write-Host "   b. Application tab > Storage" -ForegroundColor White
Write-Host "   c. Clear site data / Clear storage" -ForegroundColor White
Write-Host "   d. Atau gunakan Ctrl+Shift+Delete" -ForegroundColor White
Write-Host ""
Write-Host "   Tekan Enter setelah clear storage..." -ForegroundColor Yellow
Read-Host

# Start dev server
Write-Host ""
Write-Host "4. Starting dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  APLIKASI SIAP DITEST" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login dengan:" -ForegroundColor Yellow
Write-Host "  Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Perbaikan yang diterapkan:" -ForegroundColor Yellow
Write-Host "  1. Removed custom storage adapter" -ForegroundColor White
Write-Host "  2. Removed signOut before login" -ForegroundColor White
Write-Host "  3. Simplified auth error handler" -ForegroundColor White
Write-Host "  4. Removed duplicate auth listeners" -ForegroundColor White
Write-Host ""
Write-Host "Setelah login, Anda harus bisa:" -ForegroundColor Yellow
Write-Host "  - Masuk ke dashboard" -ForegroundColor White
Write-Host "  - Akses semua menu (Units, Users, KPI Config, Pool, dll)" -ForegroundColor White
Write-Host "  - Tidak ada redirect loop" -ForegroundColor White
Write-Host "  - Tidak ada console error berulang" -ForegroundColor White
Write-Host ""

npm run dev
