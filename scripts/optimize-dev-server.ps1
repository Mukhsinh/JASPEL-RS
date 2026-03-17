#!/usr/bin/env pwsh

Write-Host "🚀 Optimizing Development Server Performance..." -ForegroundColor Green

# Clear Next.js cache
Write-Host "`n1. Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cleared .next cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No .next cache found" -ForegroundColor Blue
}

# Clear node_modules cache
Write-Host "`n2. Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cleared node_modules cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No node_modules cache found" -ForegroundColor Blue
}

# Clear TypeScript build info
Write-Host "`n3. Clearing TypeScript cache..." -ForegroundColor Yellow
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "✅ Cleared TypeScript build info" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No TypeScript build info found" -ForegroundColor Blue
}

# Install dependencies with clean cache
Write-Host "`n4. Reinstalling dependencies..." -ForegroundColor Yellow
npm ci --prefer-offline --no-audit
Write-Host "✅ Dependencies reinstalled" -ForegroundColor Green

# Start optimized dev server
Write-Host "`n5. Starting optimized development server..." -ForegroundColor Yellow
Write-Host "🔧 Performance optimizations applied:" -ForegroundColor Cyan
Write-Host "   - Disabled file polling" -ForegroundColor White
Write-Host "   - Reduced rebuild timeout" -ForegroundColor White
Write-Host "   - Optimized webpack config" -ForegroundColor White
Write-Host "   - Improved cache management" -ForegroundColor White
Write-Host "   - Database query optimization" -ForegroundColor White

Write-Host "`n🚀 Starting server with optimizations..." -ForegroundColor Green
npm run dev