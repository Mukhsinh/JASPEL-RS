# Test Login with Hard Redirect Fix
Write-Host "=== Testing Login with Hard Redirect ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting dev server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "=== MANUAL TEST INSTRUCTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Open browser to: http://localhost:3002/login" -ForegroundColor White
Write-Host "2. Enter credentials:" -ForegroundColor White
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host "3. Click 'Masuk ke Sistem'" -ForegroundColor White
Write-Host "4. You should be redirected to dashboard immediately" -ForegroundColor White
Write-Host ""
Write-Host "Expected behavior:" -ForegroundColor Yellow
Write-Host "- Button shows 'Memproses...' briefly" -ForegroundColor White
Write-Host "- Page redirects to /dashboard automatically" -ForegroundColor White
Write-Host "- No infinite loading state" -ForegroundColor White
Write-Host ""
Write-Host "Check browser console for logs starting with [LOGIN] and [MIDDLEWARE]" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server when done testing" -ForegroundColor Red
