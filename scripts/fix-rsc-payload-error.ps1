# Fix RSC Payload Error - React Version Mismatch
Write-Host "=== Memperbaiki RSC Payload Error ===" -ForegroundColor Green

# Stop any running processes
Write-Host "Menghentikan proses yang berjalan..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean build artifacts
Write-Host "Membersihkan build artifacts..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
}

# Clear npm cache
Write-Host "Membersihkan npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Reinstall dependencies with exact versions
Write-Host "Menginstall ulang dependencies..." -ForegroundColor Yellow
npm install --no-optional --legacy-peer-deps

# Build fresh
Write-Host "Building aplikasi..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build berhasil! Memulai aplikasi..." -ForegroundColor Green
    npm run dev
} else {
    Write-Host "Build gagal! Periksa error di atas." -ForegroundColor Red
    exit 1
}