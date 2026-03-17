#!/usr/bin/env pwsh

# QUICK PERFORMANCE TEST
# Test cepat untuk mengukur improvement performance

Write-Host "⚡ QUICK PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "Testing performance improvements..." -ForegroundColor Gray
Write-Host ""

# Test database performance
Write-Host "📊 Database Performance:" -ForegroundColor Yellow
npx tsx scripts/test-performance-improvements.ts

Write-Host "`n🌐 Browser Performance:" -ForegroundColor Yellow  
npx tsx scripts/test-browser-performance.ts

Write-Host "`n✅ Quick test completed!" -ForegroundColor Green
Write-Host "`nFor continuous monitoring, run:" -ForegroundColor Gray
Write-Host ".\TEST_PERFORMANCE_NOW.ps1 -Monitor" -ForegroundColor Cyan