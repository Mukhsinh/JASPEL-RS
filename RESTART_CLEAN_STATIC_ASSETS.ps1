#!/usr/bin/env pwsh

Write-Host "🔧 Memperbaiki Static Assets Loading..." -ForegroundColor Yellow

# Stop semua proses Node.js
Write-Host "Menghentikan proses Node.js..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Bersihkan build artifacts
Write-Host "Membersihkan build artifacts..." -ForegroundColor Blue
$pathsToClean = @(
    ".next",
    "node_modules/.cache", 
    "tsconfig.tsbuildinfo",
    ".eslintcache"
)

foreach ($path in $pathsToClean) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "   ✅ Dihapus: $path" -ForegroundColor Green
    }
}

# Clear npm cache
Write-Host "Membersihkan npm cache..." -ForegroundColor Blue
npm cache clean --force 2>$null

# Verifikasi konfigurasi Next.js
Write-Host "Memverifikasi konfigurasi Next.js..." -ForegroundColor Blue
if (Test-Path "next.config.js") {
    Write-Host "   ✅ Konfigurasi Next.js ditemukan" -ForegroundColor Green
} else {
    Write-Host "   ❌ Konfigurasi Next.js tidak ditemukan" -ForegroundColor Red
    exit 1
}

# Set environment variables untuk development yang bersih
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "🚀 Memulai development server..." -ForegroundColor Green
Write-Host "   Server akan berjalan di http://localhost:3002" -ForegroundColor Cyan
Write-Host "   Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Cyan

# Start development server
npm run dev