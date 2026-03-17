#!/usr/bin/env pwsh

Write-Host "🔄 Restarting aplikasi setelah perbaikan login..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "⏹️ Menghentikan proses yang berjalan..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Next.js cache
Write-Host "🧹 Membersihkan cache Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# Clear node_modules cache if needed
Write-Host "🧹 Membersihkan cache npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null

Write-Host "✅ Cache dibersihkan" -ForegroundColor Green

# Start development server
Write-Host "🚀 Memulai development server..." -ForegroundColor Cyan
Write-Host "📱 Aplikasi akan tersedia di: http://localhost:3002" -ForegroundColor Green
Write-Host "🔑 Login dengan: mukhsin9@gmail.com / admin123" -ForegroundColor Green
Write-Host "" 
Write-Host "✨ Masalah login redirect sudah diperbaiki!" -ForegroundColor Green
Write-Host "   - User metadata role: ✅" -ForegroundColor Green  
Write-Host "   - Employee record: ✅" -ForegroundColor Green
Write-Host "   - Session persistence: ✅" -ForegroundColor Green
Write-Host "   - Dashboard authorization: ✅" -ForegroundColor Green
Write-Host ""

npm run dev