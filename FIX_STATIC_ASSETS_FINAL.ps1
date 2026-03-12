#!/usr/bin/env pwsh

Write-Host "🔧 Perbaikan Final Static Assets..." -ForegroundColor Yellow

# Hentikan semua proses Node.js
Write-Host "Menghentikan semua proses Node.js..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Tunggu port bebas
Write-Host "Menunggu port 3002 bebas..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Bersihkan semua build artifacts
Write-Host "Membersihkan build artifacts..." -ForegroundColor Blue
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue

Write-Host "✅ Build artifacts dibersihkan" -ForegroundColor Green

# Set environment variables
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "🚀 Memulai server dengan konfigurasi bersih..." -ForegroundColor Green
Write-Host "Server: http://localhost:3002" -ForegroundColor Cyan

# Start server
npm run dev