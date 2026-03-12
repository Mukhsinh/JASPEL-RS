#!/usr/bin/env pwsh

Write-Host "🔧 Quick Export Test..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Checking export route file..." -ForegroundColor Yellow
if (Test-Path "app/api/kpi-config/export/route.ts") {
    Write-Host "   ✅ Export route exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Export route missing" -ForegroundColor Red
}

Write-Host "2. Checking guide generator..." -ForegroundColor Yellow
if (Test-Path "lib/export/guide-generator.ts") {
    Write-Host "   ✅ Guide generator exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Guide generator missing" -ForegroundColor Red
}

Write-Host "3. Checking guide route..." -ForegroundColor Yellow
if (Test-Path "app/api/kpi-config/guide/route.ts") {
    Write-Host "   ✅ Guide route exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Guide route missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Export Fix Summary:" -ForegroundColor Cyan
Write-Host "✅ Fixed nested query issue in export endpoint" -ForegroundColor Green
Write-Host "✅ Updated sub indicator handling for scoring_criteria" -ForegroundColor Green
Write-Host "✅ Created comprehensive system guide generator" -ForegroundColor Green
Write-Host "✅ Added guide PDF download endpoint" -ForegroundColor Green
Write-Host "✅ Export buttons already exist in KPI config page" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Ready to test:" -ForegroundColor Yellow
Write-Host "1. Start server: npm run dev" -ForegroundColor White
Write-Host "2. Go to KPI Config page" -ForegroundColor White
Write-Host "3. Click 'Petunjuk PDF' for system guide" -ForegroundColor White
Write-Host "4. Select unit and click 'Laporan Excel/PDF' for export" -ForegroundColor White