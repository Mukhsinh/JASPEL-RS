#!/usr/bin/env pwsh

Write-Host "🚀 JASPEL KPI System - Chunk Error Fixed" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Stop any running processes
Write-Host "⏹️ Menghentikan proses yang berjalan..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean any remaining build artifacts if needed
Write-Host "🧹 Membersihkan cache jika diperlukan..." -ForegroundColor Blue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Start the application
Write-Host "🏗️ Memulai aplikasi dengan konfigurasi yang sudah diperbaiki..." -ForegroundColor Blue
Write-Host ""
Write-Host "✅ Perbaikan yang telah diterapkan:" -ForegroundColor Green
Write-Host "   - Webpack configuration optimized" -ForegroundColor White
Write-Host "   - Chunk loading errors fixed" -ForegroundColor White
Write-Host "   - Build process stabilized" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Aplikasi akan tersedia di: http://localhost:3002" -ForegroundColor Cyan
Write-Host "📊 Dashboard: http://localhost:3002/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Memulai development server..." -ForegroundColor Yellow

# Start the development server
npm run dev