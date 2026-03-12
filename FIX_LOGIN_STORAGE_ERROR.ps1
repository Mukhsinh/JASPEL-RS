#!/usr/bin/env pwsh

Write-Host "🚀 Memperbaiki Error Storage Login..." -ForegroundColor Green
Write-Host ""

# Stop development server jika berjalan
Write-Host "⏹️ Menghentikan server development..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Jalankan script perbaikan
Write-Host "🔧 Menjalankan perbaikan storage..." -ForegroundColor Yellow
npx tsx scripts/fix-login-storage-error.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Perbaikan storage selesai!" -ForegroundColor Green
    Write-Host ""
    
    # Clear Next.js cache
    Write-Host "🧹 Membersihkan cache Next.js..." -ForegroundColor Yellow
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    }
    
    # Restart development server
    Write-Host "🚀 Memulai ulang server development..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Langkah selanjutnya:" -ForegroundColor Cyan
    Write-Host "1. Buka browser dan clear cache/cookies" -ForegroundColor White
    Write-Host "2. Buka http://localhost:3000/login" -ForegroundColor White
    Write-Host "3. Coba login dengan kredensial yang valid" -ForegroundColor White
    Write-Host ""
    
    # Start development server
    npm run dev
} else {
    Write-Host ""
    Write-Host "❌ Perbaikan gagal! Periksa error di atas." -ForegroundColor Red
    exit 1
}