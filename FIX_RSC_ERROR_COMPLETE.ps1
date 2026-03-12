#!/usr/bin/env pwsh

Write-Host "🔧 Memperbaiki RSC Error dan Restart Aplikasi..." -ForegroundColor Cyan

try {
    # 1. Jalankan script perbaikan RSC
    Write-Host "`n1. Menjalankan perbaikan RSC..." -ForegroundColor Yellow
    npx tsx scripts/fix-rsc-error.ts
    
    if ($LASTEXITCODE -ne 0) {
        throw "Gagal menjalankan perbaikan RSC"
    }

    # 2. Tunggu sebentar
    Write-Host "`n2. Menunggu sistem siap..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    # 3. Start development server
    Write-Host "`n3. Memulai development server..." -ForegroundColor Yellow
    Write-Host "   Server akan berjalan di: http://localhost:3002" -ForegroundColor Green
    Write-Host "   Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
    
    # Start server dengan error handling yang lebih baik
    npm run dev

} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Pastikan port 3002 tidak digunakan aplikasi lain" -ForegroundColor Gray
    Write-Host "   2. Coba restart terminal sebagai administrator" -ForegroundColor Gray
    Write-Host "   3. Jalankan: npm install --force" -ForegroundColor Gray
    exit 1
}