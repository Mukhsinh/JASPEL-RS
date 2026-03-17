#!/usr/bin/env pwsh

Write-Host "🚀 Testing perbaikan createClient error di login page" -ForegroundColor Green
Write-Host ""

# Check if dev server is running
Write-Host "🔍 Checking dev server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -Method HEAD -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Dev server berjalan di http://localhost:3002" -ForegroundColor Green
} catch {
    Write-Host "❌ Dev server tidak berjalan. Jalankan 'npm run dev' terlebih dahulu." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Membuka browser untuk test login..." -ForegroundColor Yellow
Write-Host "📋 Kredensial test:"
Write-Host "   Email: mukhsin9@gmail.com"
Write-Host "   Password: admin123"
Write-Host ""

# Open browser
Start-Process "http://localhost:3002/login"

Write-Host "💡 Instruksi test:" -ForegroundColor Cyan
Write-Host "1. Buka Developer Tools (F12)"
Write-Host "2. Pergi ke tab Console"
Write-Host "3. Masukkan kredensial dan klik 'Masuk ke Sistem'"
Write-Host "4. Periksa apakah masih ada error 'createClient is not defined'"
Write-Host ""
Write-Host "✅ Jika tidak ada error createClient, perbaikan berhasil!" -ForegroundColor Green
Write-Host "❌ Jika masih ada error, laporkan ke developer" -ForegroundColor Red