# Script untuk Push ke GitHub
# Jalankan script ini dan masukkan token GitHub Anda saat diminta

Write-Host "=== Push JASPEL ke GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Cek status git
Write-Host "Memeriksa status repository..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Remote repository:" -ForegroundColor Yellow
git remote -v

Write-Host ""
Write-Host "PENTING: Anda memerlukan Personal Access Token dari GitHub" -ForegroundColor Red
Write-Host "Cara mendapatkan token:" -ForegroundColor Yellow
Write-Host "1. Buka: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "2. Klik 'Generate new token' -> 'Generate new token (classic)'" -ForegroundColor White
Write-Host "3. Beri nama: 'JASPEL Push Token'" -ForegroundColor White
Write-Host "4. Pilih scope: 'repo' (centang semua)" -ForegroundColor White
Write-Host "5. Klik 'Generate token' dan COPY token tersebut" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Apakah Anda sudah punya token? (y/n)"

if ($continue -eq "y") {
    Write-Host ""
    Write-Host "Melakukan push ke GitHub..." -ForegroundColor Green
    Write-Host "Anda akan diminta username dan password:" -ForegroundColor Yellow
    Write-Host "- Username: boshadi3030" -ForegroundColor White
    Write-Host "- Password: PASTE TOKEN ANDA (bukan password GitHub)" -ForegroundColor White
    Write-Host ""
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Berhasil push ke GitHub!" -ForegroundColor Green
        Write-Host "Repository: https://github.com/boshadi3030/jaspel" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "✗ Push gagal. Periksa token Anda." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Silakan buat token terlebih dahulu, lalu jalankan script ini lagi." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tekan Enter untuk keluar..."
Read-Host
