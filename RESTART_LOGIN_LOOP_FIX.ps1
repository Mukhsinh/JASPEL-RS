Write-Host "Restarting aplikasi dengan login loop fix..." -ForegroundColor Cyan
Write-Host ""

# Stop any running dev server
Write-Host "Stopping existing dev server..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

# Start dev server
Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "Aplikasi akan berjalan di: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Silakan test login dengan:" -ForegroundColor Yellow
Write-Host "Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Perhatikan console browser - seharusnya tidak ada log berulang" -ForegroundColor Yellow
Write-Host ""

npm run dev
