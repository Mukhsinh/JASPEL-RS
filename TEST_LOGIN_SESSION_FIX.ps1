#!/usr/bin/env pwsh

Write-Host "🔧 Testing Login Session Fix..." -ForegroundColor Cyan

# Start the development server
Write-Host "1. Starting development server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Minimized

# Wait for server to start
Write-Host "2. Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Open browser to login page
Write-Host "3. Opening login page..." -ForegroundColor Yellow
Start-Process "http://localhost:3000/login"

Write-Host "✅ Login page opened. Please test the login manually:" -ForegroundColor Green
Write-Host "   - Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "   - Password: admin123" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Expected behavior:" -ForegroundColor Yellow
Write-Host "   - Login should succeed without session timeout" -ForegroundColor White
Write-Host "   - Should redirect to /dashboard immediately" -ForegroundColor White
Write-Host "   - No 'ready but cookies not set yet' errors" -ForegroundColor White

Read-Host "Press Enter when done testing"