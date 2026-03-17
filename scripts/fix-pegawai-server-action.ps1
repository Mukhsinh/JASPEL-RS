#!/usr/bin/env pwsh

Write-Host "=== Memperbaiki Server Action Error di Halaman Pegawai ===" -ForegroundColor Cyan
Write-Host ""

# Stop any running dev server
Write-Host "1. Menghentikan server yang berjalan..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node_modules*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "2. Membersihkan cache Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "   ✓ Cache .next dihapus" -ForegroundColor Green
}

# Clear node_modules/.cache
Write-Host "3. Membersihkan cache node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
    Write-Host "   ✓ Cache node_modules dihapus" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Perbaikan Selesai ===" -ForegroundColor Green
Write-Host ""
Write-Host "Langkah selanjutnya:" -ForegroundColor Cyan
Write-Host "1. Jalankan: npm run dev" -ForegroundColor White
Write-Host "2. Buka browser dan akses: http://localhost:3002/pegawai" -ForegroundColor White
Write-Host "3. Tekan Ctrl+Shift+R untuk hard refresh browser" -ForegroundColor White
Write-Host ""
Write-Host "Jika masih error, tutup semua tab browser dan buka kembali" -ForegroundColor Yellow
