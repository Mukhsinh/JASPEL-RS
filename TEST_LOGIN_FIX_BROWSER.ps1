#!/usr/bin/env pwsh

Write-Host "🚀 Testing Login Fix in Browser..." -ForegroundColor Green
Write-Host ""

# Test komponen terlebih dahulu
Write-Host "🧪 Testing components..." -ForegroundColor Yellow
npx tsx scripts/test-browser-login-fix.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Component test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All components working!" -ForegroundColor Green
Write-Host ""

# Stop existing development server
Write-Host "⏹️ Stopping existing server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Next.js cache
Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🔧 Perbaikan yang telah dilakukan:" -ForegroundColor Cyan
Write-Host "✅ Custom storage adapter untuk mengatasi localStorage error" -ForegroundColor White
Write-Host "✅ Error handling yang lebih robust di auth service" -ForegroundColor White
Write-Host "✅ Timeout dan retry logic di settings context" -ForegroundColor White
Write-Host "✅ Safe storage cleanup methods" -ForegroundColor White
Write-Host ""

Write-Host "📋 Langkah testing manual:" -ForegroundColor Cyan
Write-Host "1. Server akan dimulai otomatis" -ForegroundColor White
Write-Host "2. Buka browser ke: http://localhost:3000/login" -ForegroundColor White
Write-Host "3. Buka Developer Tools (F12)" -ForegroundColor White
Write-Host "4. Periksa Console untuk error storage" -ForegroundColor White
Write-Host "5. Coba login dengan kredensial valid" -ForegroundColor White
Write-Host "6. Perhatikan apakah error 'Cannot read properties of undefined' masih muncul" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop server" -ForegroundColor Yellow
Write-Host ""

# Start development server
npm run dev