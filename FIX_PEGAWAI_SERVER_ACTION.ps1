Write-Host "=== PERBAIKAN SERVER ACTION PEGAWAI ===" -ForegroundColor Cyan
Write-Host ""

# Stop any running dev server
Write-Host "Menghentikan server yang berjalan..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clean build cache
Write-Host "Membersihkan cache build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✓ Cache .next dihapus" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
    Write-Host "✓ Cache node_modules dihapus" -ForegroundColor Green
}

# Clear Next.js cache
Write-Host "Membersihkan cache Next.js..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\.next") {
    Remove-Item -Path "$env:TEMP\.next" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== MEMULAI SERVER ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server akan dimulai dengan cache bersih..." -ForegroundColor Yellow
Write-Host "Tunggu hingga 'Ready' muncul, lalu buka: http://localhost:3002/pegawai" -ForegroundColor Green
Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

# Start dev server
npm run dev
