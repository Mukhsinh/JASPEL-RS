# Start Dev Server and Test Login
Write-Host "=== Starting Dev Server ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server akan start di http://localhost:3002" -ForegroundColor Yellow
Write-Host ""
Write-Host "Setelah server ready:" -ForegroundColor Green
Write-Host "1. Buka browser ke: http://localhost:3002/login" -ForegroundColor White
Write-Host "2. Login dengan:" -ForegroundColor White
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host "3. Klik 'Masuk ke Sistem'" -ForegroundColor White
Write-Host ""
Write-Host "Expected: Redirect otomatis ke dashboard (TIDAK застрял di 'Memproses...')" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop server" -ForegroundColor Red
Write-Host ""

npm run dev
