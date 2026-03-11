#!/usr/bin/env pwsh

Write-Host "🔧 Memperbaiki Chunk Module Error..." -ForegroundColor Yellow

# Run the TypeScript fix script
Write-Host "🚀 Menjalankan script perbaikan..." -ForegroundColor Blue
npx tsx scripts/fix-chunk-module-error.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Perbaikan berhasil!" -ForegroundColor Green
    Write-Host "🚀 Memulai server..." -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host "❌ Perbaikan gagal!" -ForegroundColor Red
    Write-Host "🔄 Mencoba perbaikan manual..." -ForegroundColor Yellow
    
    # Manual cleanup
    Write-Host "🧹 Membersihkan cache manual..." -ForegroundColor Blue
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }
    if (Test-Path ".turbo") { Remove-Item -Recurse -Force ".turbo" }
    
    Write-Host "📦 Reinstall dependencies..." -ForegroundColor Blue
    npm cache clean --force
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
    npm install
    
    Write-Host "🚀 Memulai server..." -ForegroundColor Yellow
    npm run dev
}