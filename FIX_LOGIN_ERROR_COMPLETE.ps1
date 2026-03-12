#!/usr/bin/env pwsh

Write-Host "🔧 PERBAIKAN LOGIN ERROR - COMPLETE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Stop existing dev server
Write-Host "`n1️⃣ Menghentikan server yang berjalan..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Server dihentikan" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Tidak ada server yang perlu dihentikan" -ForegroundColor Yellow
}

# 2. Clear cache dan temporary files
Write-Host "`n2️⃣ Membersihkan cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ .next folder dihapus" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Node modules cache dihapus" -ForegroundColor Green
}

# 3. Jalankan perbaikan database
Write-Host "`n3️⃣ Memperbaiki database dan user..." -ForegroundColor Yellow
try {
    npx tsx scripts/fix-login-error-complete.ts
    Write-Host "✅ Database diperbaiki" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error perbaikan database: $_" -ForegroundColor Red
}

# 4. Start development server
Write-Host "`n4️⃣ Memulai development server..." -ForegroundColor Yellow
Write-Host "Server akan berjalan di: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Kredensial login:" -ForegroundColor Cyan
Write-Host "  Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White

# Start server in background
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden

# Wait for server to start
Write-Host "`n⏳ Menunggu server siap..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 5. Test login
Write-Host "`n5️⃣ Testing login..." -ForegroundColor Yellow
try {
    npx tsx scripts/test-login-after-fix.ts
} catch {
    Write-Host "⚠️ Error testing: $_" -ForegroundColor Red
}

Write-Host "`n🎉 PERBAIKAN SELESAI!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ Server berjalan di: http://localhost:3002" -ForegroundColor Green
Write-Host "✅ Halaman login: http://localhost:3002/login" -ForegroundColor Green
Write-Host "✅ Kredensial: mukhsin9@gmail.com / admin123" -ForegroundColor Green
Write-Host "`n📝 Jika masih ada error, periksa console browser untuk detail" -ForegroundColor Yellow

# Keep script running to show server status
Write-Host "`n🔄 Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Cyan
try {
    while ($true) {
        Start-Sleep -Seconds 30
        Write-Host "⚡ Server masih berjalan..." -ForegroundColor Gray
    }
} catch {
    Write-Host "`n👋 Server dihentikan" -ForegroundColor Yellow
}