# Quick Push ke GitHub dengan Autentikasi

Write-Host "=== Quick Push ke GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Cek apakah ada perubahan
$status = git status --porcelain
if ($status) {
    Write-Host "Ada perubahan yang belum di-commit:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $commit = Read-Host "Commit semua perubahan? (y/n)"
    if ($commit -eq "y") {
        $message = Read-Host "Commit message (tekan Enter untuk 'Update JASPEL system')"
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "Update JASPEL system"
        }
        
        git add .
        git commit -m $message
        Write-Host "✓ Perubahan telah di-commit" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Melakukan push ke GitHub..." -ForegroundColor Yellow
Write-Host "Jika diminta login, gunakan salah satu:" -ForegroundColor Cyan
Write-Host "- Browser authentication (OAuth)" -ForegroundColor White
Write-Host "- Personal Access Token" -ForegroundColor White
Write-Host ""

# Push dengan verbose untuk melihat progress
git push -u origin main --verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Berhasil push ke GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/boshadi3030/jaspel" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Push gagal" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solusi alternatif:" -ForegroundColor Yellow
    Write-Host "1. Gunakan GitHub Desktop (download dari desktop.github.com)" -ForegroundColor White
    Write-Host "2. Gunakan SSH: .\SETUP_GITHUB_SSH.ps1" -ForegroundColor White
    Write-Host "3. Gunakan Token: .\PUSH_TO_GITHUB.ps1" -ForegroundColor White
}

Write-Host ""
Read-Host "Tekan Enter untuk keluar"
