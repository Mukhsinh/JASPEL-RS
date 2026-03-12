Write-Host "=== TEST LOGIN SEKARANG ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Menjalankan test login..." -ForegroundColor Yellow
npx tsx scripts/diagnose-login-now.ts

Write-Host ""
Write-Host "=== INSTRUKSI MANUAL TEST ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Buka browser dan akses: http://localhost:3002/login" -ForegroundColor Green
Write-Host "2. Gunakan kredensial:" -ForegroundColor Green
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "3. Klik tombol 'Masuk ke Sistem'" -ForegroundColor Green
Write-Host ""
Write-Host "4. Perhatikan:" -ForegroundColor Yellow
Write-Host "   - Apakah muncul loading indicator?" -ForegroundColor White
Write-Host "   - Apakah ada error message?" -ForegroundColor White
Write-Host "   - Apakah redirect ke /dashboard berhasil?" -ForegroundColor White
Write-Host ""
Write-Host "5. Buka Developer Console (F12) untuk melihat log:" -ForegroundColor Yellow
Write-Host "   - [LOGIN] Starting login process..." -ForegroundColor White
Write-Host "   - [LOGIN] Login successful..." -ForegroundColor White
Write-Host "   - [LOGIN] Session verified..." -ForegroundColor White
Write-Host "   - [LOGIN] Redirecting to: /dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Jika masih gagal, screenshot console dan beritahu saya." -ForegroundColor Red
