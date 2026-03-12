Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TEST LOGIN - JASPEL KPI SYSTEM" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Run fix script first
Write-Host "1. Memperbaiki data user..." -ForegroundColor Yellow
npx tsx scripts/fix-login-redirect-complete.ts

Write-Host ""
Write-Host "2. Memulai development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server akan berjalan di: http://localhost:3002/login" -ForegroundColor Green
Write-Host ""
Write-Host "Kredensial login:" -ForegroundColor Cyan
Write-Host "  Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev
