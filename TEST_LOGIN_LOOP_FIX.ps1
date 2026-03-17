Write-Host "Testing Login Loop Fix..." -ForegroundColor Cyan
Write-Host ""

# Run test script
npx tsx scripts/test-login-loop-fix.ts

Write-Host ""
Write-Host "Test selesai!" -ForegroundColor Green
Write-Host ""
Write-Host "Silakan test manual di browser:" -ForegroundColor Yellow
Write-Host "1. Buka http://localhost:3000/login" -ForegroundColor White
Write-Host "2. Login dengan: mukhsin9@gmail.com / admin123" -ForegroundColor White
Write-Host "3. Perhatikan console browser - seharusnya tidak ada log berulang" -ForegroundColor White
Write-Host "4. Seharusnya langsung redirect ke /dashboard tanpa loop" -ForegroundColor White
