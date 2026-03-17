# Test Login Final Fix
Write-Host "=== Testing Login Final Fix ===" -ForegroundColor Cyan
Write-Host ""

# Kill any existing dev server
Write-Host "Stopping any existing dev server..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Starting dev server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "=== MANUAL TEST INSTRUCTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Browser akan terbuka ke halaman login" -ForegroundColor White
Write-Host "2. Credentials sudah terisi otomatis:" -ForegroundColor White
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host "3. Klik tombol 'Masuk ke Sistem'" -ForegroundColor White
Write-Host ""
Write-Host "Expected Result:" -ForegroundColor Yellow
Write-Host "✓ Tombol berubah menjadi 'Memproses...' sebentar" -ForegroundColor Green
Write-Host "✓ Halaman redirect ke /dashboard secara otomatis" -ForegroundColor Green
Write-Host "✓ Dashboard muncul dengan data user" -ForegroundColor Green
Write-Host "✓ TIDAK застрял di status 'Memproses...'" -ForegroundColor Green
Write-Host ""
Write-Host "Buka browser console (F12) untuk melihat log [LOGIN] dan [MIDDLEWARE]" -ForegroundColor Yellow
Write-Host ""

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:3002/login"

Write-Host ""
Write-Host "Press any key to stop the server..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force
Write-Host ""
Write-Host "Server stopped." -ForegroundColor Green
