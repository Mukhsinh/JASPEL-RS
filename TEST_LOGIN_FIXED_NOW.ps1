Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  TEST LOGIN AFTER FIX" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping any running dev server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Waiting for server to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "  SERVER READY!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please test login manually:" -ForegroundColor Cyan
Write-Host "1. Open browser: http://localhost:3002/login" -ForegroundColor White
Write-Host "2. Login with: mukhsin9@gmail.com / admin123" -ForegroundColor White
Write-Host "3. Check if you can access dashboard without redirect loop" -ForegroundColor White
Write-Host ""
Write-Host "What to check:" -ForegroundColor Yellow
Write-Host "- Login should redirect to /dashboard immediately" -ForegroundColor White
Write-Host "- No redirect loop back to /login" -ForegroundColor White
Write-Host "- Dashboard should load with sidebar and content" -ForegroundColor White
Write-Host "- Console should show minimal auth state changes" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
