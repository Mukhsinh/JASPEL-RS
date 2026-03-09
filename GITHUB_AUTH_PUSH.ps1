# Script Autentikasi dan Push ke GitHub
# Menggunakan Git Credential Manager untuk autentikasi otomatis

Write-Host "=== Autentikasi dan Push JASPEL ke GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Hapus credential lama jika ada
Write-Host "Membersihkan credential lama..." -ForegroundColor Yellow
git credential reject <<EOF
protocol=https
host=github.com
EOF

Write-Host ""
Write-Host "Memeriksa status repository..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Remote repository saat ini:" -ForegroundColor Yellow
git remote -v

Write-Host ""
Write-Host "Melakukan autentikasi ulang dan push..." -ForegroundColor Green
Write-Host ""
Write-Host "Browser akan terbuka untuk autentikasi GitHub." -ForegroundColor Cyan
Write-Host "Silakan login dengan akun GitHub Anda." -ForegroundColor Cyan
Write-Host ""

# Set credential helper untuk Windows
git config --global credential.helper manager-core

# Lakukan push (akan memicu autentikasi)
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Berhasil push ke GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/boshadi3030/jaspel" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Credential telah disimpan. Push berikutnya tidak perlu login lagi." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✗ Push gagal." -ForegroundColor Red
    Write-Host ""
    Write-Host "Coba alternatif berikut:" -ForegroundColor Yellow
    Write-Host "1. Jalankan: .\PUSH_TO_GITHUB.ps1 (menggunakan token)" -ForegroundColor White
    Write-Host "2. Jalankan: .\SETUP_GITHUB_SSH.ps1 (menggunakan SSH)" -ForegroundColor White
}

Write-Host ""
Write-Host "Tekan Enter untuk keluar..."
Read-Host
