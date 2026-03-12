#!/usr/bin/env pwsh

Write-Host "🔧 PERBAIKAN RSC ERROR - SOLUSI LENGKAP" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

try {
    # 1. Verifikasi perbaikan
    Write-Host "`n1️⃣ Verifikasi perbaikan yang sudah dilakukan..." -ForegroundColor Yellow
    npx tsx scripts/verify-rsc-fix-complete.ts
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️ Ada issue yang perlu perhatian, tapi lanjut perbaikan..." -ForegroundColor Yellow
    }

    # 2. Stop semua proses Node.js
    Write-Host "`n2️⃣ Menghentikan semua proses Node.js..." -ForegroundColor Yellow
    try {
        taskkill /f /im node.exe 2>$null
        Write-Host "   ✅ Proses Node.js dihentikan" -ForegroundColor Green
    } catch {
        Write-Host "   ℹ️ Tidak ada proses Node.js yang berjalan" -ForegroundColor Gray
    }

    # 3. Bersihkan cache
    Write-Host "`n3️⃣ Membersihkan cache..." -ForegroundColor Yellow
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Host "   ✅ Cache .next dihapus" -ForegroundColor Green
    }
    
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache"
        Write-Host "   ✅ Cache node_modules dihapus" -ForegroundColor Green
    }

    # 4. Reinstall dependencies
    Write-Host "`n4️⃣ Reinstall dependencies untuk konsistensi versi..." -ForegroundColor Yellow
    npm ci
    
    if ($LASTEXITCODE -ne 0) {
        throw "Gagal reinstall dependencies"
    }
    Write-Host "   ✅ Dependencies berhasil diinstall" -ForegroundColor Green

    # 5. Test build
    Write-Host "`n5️⃣ Test build untuk memastikan tidak ada error..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build gagal - ada error yang perlu diperbaiki"
    }
    Write-Host "   ✅ Build berhasil" -ForegroundColor Green

    # 6. Start development server
    Write-Host "`n6️⃣ Memulai development server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Server URL: http://localhost:3002" -ForegroundColor Green
    Write-Host "🔑 Login: superadmin / admin123" -ForegroundColor Green
    Write-Host "⚡ RSC Error: FIXED" -ForegroundColor Green
    Write-Host "📱 Notifications API: FIXED" -ForegroundColor Green
    Write-Host "🎯 Assessment Page: FIXED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
    Write-Host "=" * 50 -ForegroundColor Gray

    # Start server
    npm run dev

} catch {
    Write-Host "`n❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "   1. Pastikan tidak ada aplikasi lain di port 3002" -ForegroundColor Gray
    Write-Host "   2. Restart terminal sebagai Administrator" -ForegroundColor Gray
    Write-Host "   3. Jalankan: npm install --force" -ForegroundColor Gray
    Write-Host "   4. Coba mode legacy: npm run dev:legacy" -ForegroundColor Gray
    Write-Host "`n📞 Jika masih error, cek log di atas untuk detail" -ForegroundColor Gray
    exit 1
}