# Script untuk memperbaiki chunk loading error dengan cepat
Write-Host "🔧 Memperbaiki chunk loading error..." -ForegroundColor Green

# Hentikan proses yang berjalan
Write-Host "1. Menghentikan proses yang berjalan..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Bersihkan cache dan build
Write-Host "2. Membersihkan cache dan build..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue }

# Bersihkan npm cache
Write-Host "3. Membersihkan npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Install ulang dependencies
Write-Host "4. Install ulang dependencies..." -ForegroundColor Yellow
npm ci

Write-Host "5. Memulai development server..." -ForegroundColor Yellow
Write-Host "   Akses aplikasi di: http://localhost:3002" -ForegroundColor Cyan

# Mulai development server
npm run dev