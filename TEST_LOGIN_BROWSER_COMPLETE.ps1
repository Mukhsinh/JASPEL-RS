#!/usr/bin/env pwsh

Write-Host "🔧 JASPEL Login Test - Browser Complete" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Test backend first
Write-Host "`n1. Testing backend login..." -ForegroundColor Yellow
npx tsx scripts/test-login-flow-complete.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend test failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Checking dev server..." -ForegroundColor Yellow
$response = try {
    Invoke-WebRequest -Uri "http://localhost:3002/login" -Method Head -TimeoutSec 5 -ErrorAction Stop
    $true
} catch {
    $false
}

if (-not $response) {
    Write-Host "❌ Dev server not running. Starting dev server..." -ForegroundColor Red
    Write-Host "Run this command in another terminal: npm run dev" -ForegroundColor Yellow
    Start-Process "cmd" -ArgumentList "/c", "npm run dev"
    Start-Sleep 5
}

Write-Host "`n3. Opening browser for manual test..." -ForegroundColor Yellow
Start-Process "http://localhost:3002/login"

Write-Host "`n🎯 MANUAL TEST STEPS:" -ForegroundColor Green
Write-Host "1. Browser should open to login page" -ForegroundColor White
Write-Host "2. Press F12 > Application > Storage > Clear All" -ForegroundColor White
Write-Host "3. Enter credentials:" -ForegroundColor White
Write-Host "   - Email: mukhsin9@gmail.com" -ForegroundColor Cyan
Write-Host "   - Password: admin123" -ForegroundColor Cyan
Write-Host "4. Click 'Masuk ke Sistem'" -ForegroundColor White
Write-Host "5. Should redirect to /units page" -ForegroundColor White

Write-Host "`n🔍 IF LOGIN FAILS:" -ForegroundColor Yellow
Write-Host "1. Check browser console for errors" -ForegroundColor White
Write-Host "2. Try incognito/private mode" -ForegroundColor White
Write-Host "3. Run in browser console:" -ForegroundColor White
Write-Host "   localStorage.clear(); sessionStorage.clear();" -ForegroundColor Cyan

Write-Host "`n✅ Backend tests passed - ready for browser test!" -ForegroundColor Green