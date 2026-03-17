Write-Host "=== TESTING DASHBOARD FIX ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Perbaikan yang dilakukan:" -ForegroundColor Yellow
Write-Host "1. StatCard: Mengubah prop 'icon' menjadi 'iconName' (string)" -ForegroundColor White
Write-Host "2. StatCard: Icon di-render di Client Component, bukan dikirim dari Server" -ForegroundColor White
Write-Host "3. DashboardContent: Menggunakan auth.getUser() bukan getSession()" -ForegroundColor White
Write-Host ""

Write-Host "Memulai development server..." -ForegroundColor Green
Write-Host "Silakan buka browser dan akses: http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login dengan:" -ForegroundColor Yellow
Write-Host "Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "Password: superadmin123" -ForegroundColor White
Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

npm run dev
