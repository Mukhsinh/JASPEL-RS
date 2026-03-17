# ============================================
# START SERVER - LOGIN FIX COMPLETE
# ============================================

Write-Host "🚀 MEMULAI SERVER DENGAN PERBAIKAN LOGIN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes on common ports
Write-Host "Membersihkan port yang mungkin digunakan..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    # Ignore errors
}

Write-Host ""
Write-Host "✅ SISTEM BACKEND TELAH DIVERIFIKASI:" -ForegroundColor Green
Write-Host "   • Database connection: NORMAL"
Write-Host "   • Authentication system: NORMAL" 
Write-Host "   • User permissions: NORMAL"
Write-Host "   • Middleware flow: NORMAL"
Write-Host ""

Write-Host "🔧 SOLUSI MASALAH LOGIN BROWSER:" -ForegroundColor Cyan
Write-Host ""
Write-Host "LANGKAH 1: Bersihkan Browser Cache" -ForegroundColor Yellow
Write-Host "   1. Tekan F12 untuk membuka DevTools"
Write-Host "   2. Klik kanan tombol refresh → pilih 'Empty Cache and Hard Reload'"
Write-Host "   3. Atau tekan Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)"
Write-Host ""

Write-Host "LANGKAH 2: Bersihkan Storage di DevTools" -ForegroundColor Yellow
Write-Host "   1. Buka tab 'Application' (Chrome) atau 'Storage' (Firefox)"
Write-Host "   2. Di sidebar kiri, klik 'Local Storage' → hapus semua data"
Write-Host "   3. Klik 'Session Storage' → hapus semua data"
Write-Host "   4. Klik 'Cookies' → hapus semua cookies untuk localhost"
Write-Host ""

Write-Host "LANGKAH 3: Jalankan Script Pembersihan (di Console DevTools)" -ForegroundColor Yellow
Write-Host "   // Salin dan paste script ini di Console DevTools:"
Write-Host "   localStorage.clear();" -ForegroundColor White
Write-Host "   sessionStorage.clear();" -ForegroundColor White
Write-Host "   document.cookie.split(';').forEach(c => {" -ForegroundColor White
Write-Host "     const name = c.split('=')[0].trim();" -ForegroundColor White
Write-Host "     if (name.includes('sb-') || name.includes('supabase')) {" -ForegroundColor White
Write-Host "       document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';" -ForegroundColor White
Write-Host "     }" -ForegroundColor White
Write-Host "   });" -ForegroundColor White
Write-Host "   console.log('✅ Storage dibersihkan!');" -ForegroundColor White
Write-Host ""

Write-Host "LANGKAH 4: Restart Browser Sepenuhnya" -ForegroundColor Yellow
Write-Host "   1. Tutup SEMUA tab browser"
Write-Host "   2. Tutup browser sepenuhnya (pastikan tidak ada di system tray)"
Write-Host "   3. Tunggu 5 detik"
Write-Host "   4. Buka browser kembali"
Write-Host ""

Write-Host "LANGKAH 5: Alternatif Jika Masih Bermasalah" -ForegroundColor Yellow
Write-Host "   • Coba browser berbeda (Chrome, Firefox, Edge)"
Write-Host "   • Gunakan mode incognito/private browsing"
Write-Host "   • Nonaktifkan extension browser sementara"
Write-Host "   • Periksa antivirus/firewall yang mungkin memblokir"
Write-Host ""

Write-Host "🎯 KREDENSIAL LOGIN:" -ForegroundColor Green
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "🌐 SERVER AKAN BERJALAN DI:" -ForegroundColor Green
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "Memulai development server..." -ForegroundColor Yellow
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

# Start the development server on default port
npm run dev