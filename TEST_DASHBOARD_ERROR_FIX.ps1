#!/usr/bin/env pwsh

Write-Host "🚀 Testing Dashboard Error Fix..." -ForegroundColor Green
Write-Host ""

# Verify database functions are working
Write-Host "📊 Verifying database functions..." -ForegroundColor Yellow
npx tsx scripts/verify-dashboard-fix.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database functions verification failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Database functions verified successfully!" -ForegroundColor Green
Write-Host ""

# Start development server
Write-Host "🌐 Starting development server..." -ForegroundColor Yellow
Write-Host "📍 Dashboard akan tersedia di: http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "🔑 Login dengan: superadmin@example.com / password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

npm run dev