#!/usr/bin/env pwsh

# TEST PERFORMANCE NOW
# Script cepat untuk test performance setelah optimasi

param(
    [switch]$Monitor,
    [switch]$Browser,
    [switch]$Database,
    [switch]$All
)

Write-Host "⚡ JASPEL KPI - PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Gray

if ($All -or (!$Monitor -and !$Browser -and !$Database)) {
    Write-Host "`n🧪 Running all performance tests..." -ForegroundColor Yellow
    
    # 1. Database performance
    Write-Host "`n📊 Testing database performance..." -ForegroundColor Cyan
    npx tsx scripts/test-performance-improvements.ts
    
    # 2. Browser performance  
    Write-Host "`n🌐 Testing browser performance..." -ForegroundColor Cyan
    npx tsx scripts/test-browser-performance.ts
    
    # 3. Start monitoring
    Write-Host "`n📈 Starting performance monitor..." -ForegroundColor Cyan
    Write-Host "Monitor akan update setiap 10 detik. Tekan Ctrl+C untuk stop." -ForegroundColor Gray
    npx tsx scripts/monitor-performance.ts
    
} elseif ($Database) {
    Write-Host "`n📊 Testing database performance only..." -ForegroundColor Cyan
    npx tsx scripts/test-performance-improvements.ts
    
} elseif ($Browser) {
    Write-Host "`n🌐 Testing browser performance only..." -ForegroundColor Cyan
    npx tsx scripts/test-browser-performance.ts
    
} elseif ($Monitor) {
    Write-Host "`n📈 Starting performance monitor only..." -ForegroundColor Cyan
    Write-Host "Monitor akan update setiap 10 detik. Tekan Ctrl+C untuk stop." -ForegroundColor Gray
    npx tsx scripts/monitor-performance.ts
}

Write-Host "`n✨ Performance test completed!" -ForegroundColor Green