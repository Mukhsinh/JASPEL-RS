# Script untuk Setup GitHub dengan SSH (Lebih Aman)

Write-Host "=== Setup GitHub SSH untuk JASPEL ===" -ForegroundColor Cyan
Write-Host ""

# Cek apakah SSH key sudah ada
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"

if (Test-Path $sshKeyPath) {
    Write-Host "✓ SSH key sudah ada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Public key Anda:" -ForegroundColor Yellow
    Get-Content $sshKeyPath
    Write-Host ""
    Write-Host "Copy key di atas dan tambahkan ke GitHub:" -ForegroundColor Yellow
    Write-Host "1. Buka: https://github.com/settings/keys" -ForegroundColor White
    Write-Host "2. Klik 'New SSH key'" -ForegroundColor White
    Write-Host "3. Title: 'JASPEL Development'" -ForegroundColor White
    Write-Host "4. Paste key di atas" -ForegroundColor White
    Write-Host "5. Klik 'Add SSH key'" -ForegroundColor White
} else {
    Write-Host "SSH key belum ada. Membuat SSH key baru..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tekan Enter 3x saat diminta (gunakan default)" -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -C "boshadi3030@github.com"
    
    if (Test-Path $sshKeyPath) {
        Write-Host ""
        Write-Host "✓ SSH key berhasil dibuat!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Public key Anda:" -ForegroundColor Yellow
        Get-Content $sshKeyPath
        Write-Host ""
        Write-Host "Copy key di atas dan tambahkan ke GitHub:" -ForegroundColor Yellow
        Write-Host "1. Buka: https://github.com/settings/keys" -ForegroundColor White
        Write-Host "2. Klik 'New SSH key'" -ForegroundColor White
        Write-Host "3. Title: 'JASPEL Development'" -ForegroundColor White
        Write-Host "4. Paste key di atas" -ForegroundColor White
        Write-Host "5. Klik 'Add SSH key'" -ForegroundColor White
    }
}

Write-Host ""
$setupSSH = Read-Host "Apakah SSH key sudah ditambahkan ke GitHub? (y/n)"

if ($setupSSH -eq "y") {
    Write-Host ""
    Write-Host "Mengubah remote ke SSH..." -ForegroundColor Yellow
    git remote set-url origin git@github.com:boshadi3030/jaspel.git
    
    Write-Host "Testing koneksi SSH..." -ForegroundColor Yellow
    ssh -T git@github.com
    
    Write-Host ""
    Write-Host "Melakukan push ke GitHub..." -ForegroundColor Green
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Berhasil push ke GitHub dengan SSH!" -ForegroundColor Green
        Write-Host "Repository: https://github.com/boshadi3030/jaspel" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "✗ Push gagal. Periksa koneksi SSH Anda." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Silakan tambahkan SSH key ke GitHub terlebih dahulu." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tekan Enter untuk keluar..."
Read-Host
