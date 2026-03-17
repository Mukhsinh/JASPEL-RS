# Fix Pegawai Storage Error
# Diagnose and fix the storage error on /pegawai page

Write-Host "================================" -ForegroundColor Cyan
Write-Host "FIX PEGAWAI STORAGE ERROR" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Running diagnostic..." -ForegroundColor Yellow
npx tsx scripts/fix-pegawai-storage-error.ts

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "NEXT STEPS" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Clear browser storage:" -ForegroundColor White
Write-Host "   - Press F12 to open DevTools" -ForegroundColor Gray
Write-Host "   - Go to Application > Storage" -ForegroundColor Gray
Write-Host "   - Click 'Clear site data'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Or run in browser console:" -ForegroundColor White
Write-Host "   localStorage.clear(); sessionStorage.clear(); location.reload();" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Restart dev server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Login and test /pegawai page" -ForegroundColor White
Write-Host ""
