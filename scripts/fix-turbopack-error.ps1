#!/usr/bin/env pwsh

Write-Host "🔧 Memperbaiki Turbopack Error..." -ForegroundColor Yellow

# Stop any running processes
Write-Host "⏹️ Menghentikan proses yang berjalan..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean Next.js cache and build files
Write-Host "🧹 Membersihkan cache dan build files..." -ForegroundColor Blue
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Folder .next dihapus" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cache node_modules dihapus" -ForegroundColor Green
}

# Clear npm cache
Write-Host "🧹 Membersihkan npm cache..." -ForegroundColor Blue
npm cache clean --force

# Reinstall dependencies
Write-Host "📦 Menginstall ulang dependencies..." -ForegroundColor Blue
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
npm install

Write-Host "✅ Perbaikan selesai!" -ForegroundColor Green
Write-Host "🚀 Memulai server tanpa Turbopack..." -ForegroundColor Yellow

# Start server without turbo flag
npm run dev:legacy