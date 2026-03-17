Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  PERBAIKAN LOGIN KOMPREHENSIF" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Perubahan yang dilakukan:" -ForegroundColor Yellow
Write-Host "1. Login page: Tambah delay untuk memastikan cookies ter-set" -ForegroundColor White
Write-Host "2. Login page: Verifikasi session sebelum redirect" -ForegroundColor White
Write-Host "3. Middleware: Tambah session refresh otomatis" -ForegroundColor White
Write-Host "4. Middleware: Perbaiki logic redirect ke login" -ForegroundColor White
Write-Host ""

Write-Host "Testing perbaikan..." -ForegroundColor Yellow
npx tsx scripts/fix-login-browser-redirect.ts

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  RESTART APLIKASI" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

# Stop existing server
Write-Host "Stopping existing dev server..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "Aplikasi akan berjalan di: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "CARA TEST:" -ForegroundColor Yellow
Write-Host "1. Buka http://localhost:3000/login" -ForegroundColor White
Write-Host "2. Login dengan: mukhsin9@gmail.com / admin123" -ForegroundColor White
Write-Host "3. Seharusnya langsung masuk ke dashboard" -ForegroundColor White
Write-Host "4. Cek console browser - tidak ada error" -ForegroundColor White
Write-Host ""

npm run dev
