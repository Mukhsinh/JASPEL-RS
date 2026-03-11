#!/usr/bin/env pwsh

Write-Host "🚀 Memulai Aplikasi JASPEL KPI System..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ File .env.local tidak ditemukan!" -ForegroundColor Red
    Write-Host "📋 Silakan copy dari .env.local.example dan isi dengan konfigurasi Supabase Anda" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables OK" -ForegroundColor Green

# Test build first
Write-Host "🔨 Testing build..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build gagal!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build berhasil!" -ForegroundColor Green

# Start development server
Write-Host "🌐 Memulai development server..." -ForegroundColor Blue
Write-Host "📍 Aplikasi akan berjalan di: http://localhost:3002" -ForegroundColor Yellow
Write-Host "📋 Halaman yang tersedia:" -ForegroundColor Yellow
Write-Host "   - http://localhost:3002/login - Halaman Login" -ForegroundColor Cyan
Write-Host "   - http://localhost:3002/forbidden - Halaman Akses Ditolak" -ForegroundColor Cyan
Write-Host "   - http://localhost:3002/dashboard - Dashboard (setelah login)" -ForegroundColor Cyan
Write-Host "   - http://localhost:3002/pool - Manajemen Pool" -ForegroundColor Cyan
Write-Host "   - http://localhost:3002/settings - Pengaturan Sistem" -ForegroundColor Cyan
Write-Host "   - http://localhost:3002/assessment - Penilaian KPI" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🔑 Login dengan:" -ForegroundColor Yellow
Write-Host "   Email: admin@jaspel.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "⏹️ Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Yellow

npm run dev