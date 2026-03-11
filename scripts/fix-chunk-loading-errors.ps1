#!/usr/bin/env pwsh

Write-Host "🔧 Memperbaiki Chunk Loading Errors..." -ForegroundColor Yellow

# Stop any running processes
Write-Host "⏹️ Menghentikan proses yang berjalan..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean build artifacts
Write-Host "🧹 Membersihkan build artifacts..." -ForegroundColor Blue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue

# Clear npm cache
Write-Host "🗑️ Membersihkan npm cache..." -ForegroundColor Blue
npm cache clean --force

# Reinstall dependencies
Write-Host "📦 Menginstall ulang dependencies..." -ForegroundColor Blue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
npm install

# Build the application
Write-Host "🏗️ Building aplikasi..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build berhasil! Memulai server..." -ForegroundColor Green
    
    # Start the server
    Write-Host "🚀 Memulai development server..." -ForegroundColor Blue
    npm run dev
} else {
    Write-Host "❌ Build gagal! Periksa error di atas." -ForegroundColor Red
    exit 1
}