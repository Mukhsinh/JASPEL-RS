Write-Host "=== TEST LOGIN REDIRECT SETELAH PERBAIKAN ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Memulai development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Minimized

Write-Host "2. Menunggu server siap..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "3. Membuka browser untuk test login..." -ForegroundColor Yellow
Start-Process "http://localhost:3002/login"

Write-Host ""
Write-Host "=== INSTRUKSI TEST ===" -ForegroundColor Cyan
Write-Host "1. Buka Developer Tools (F12) -> Console tab"
Write-Host "2. Login dengan: mukhsin9@gmail.com / admin123"
Write-Host "3. Perhatikan log di console untuk melihat proses session"
Write-Host "4. Jika berhasil, akan redirect ke dashboard"
Write-Host "5. Jika masih redirect ke login, coba:"
Write-Host "   - Clear browser cache (Ctrl+Shift+Del)"
Write-Host "   - Coba browser incognito mode"
Write-Host "   - Restart development server"
Write-Host ""

Write-Host "=== PERBAIKAN YANG DILAKUKAN ===" -ForegroundColor Green
Write-Host "✅ Menggunakan window.location.replace() untuk redirect"
Write-Host "✅ Menambahkan delay 500ms sebelum redirect"
Write-Host "✅ Memperpanjang waktu tunggu session ke 30 attempts"
Write-Host "✅ Menambahkan check untuk auth cookies"
Write-Host ""

Write-Host "Tekan Enter untuk melanjutkan atau Ctrl+C untuk keluar..."
Read-Host