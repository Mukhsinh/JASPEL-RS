Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST DASHBOARD MODERN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Membersihkan cache..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   ✓ Cache dibersihkan" -ForegroundColor Green
Write-Host ""

Write-Host "2. Memulai development server..." -ForegroundColor Yellow
Write-Host "   Server akan berjalan di http://localhost:3002" -ForegroundColor Cyan
Write-Host "   Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
