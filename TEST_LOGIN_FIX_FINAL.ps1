#!/usr/bin/env pwsh

Write-Host "🔧 Testing Login Fix - Final" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Stop any running dev server
Write-Host "🛑 Stopping any running dev server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Run the login fix test
Write-Host "🧪 Running login fix test..." -ForegroundColor Yellow
npx tsx scripts/test-login-fix-final.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login test failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Login test passed!" -ForegroundColor Green

# Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
Write-Host "📱 Open browser to: http://localhost:3003" -ForegroundColor Cyan
Write-Host "📧 Test login with: mukhsin9@gmail.com / admin123" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray

# Start the server
npm run dev