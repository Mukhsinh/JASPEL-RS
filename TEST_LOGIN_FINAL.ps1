Write-Host "🧪 Testing Login - Final Check" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""

# 1. Test backend login
Write-Host "1️⃣ Testing backend login..." -ForegroundColor Yellow
npx tsx scripts/test-browser-login-complete.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Backend test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Backend login: OK" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUKSI UNTUK TEST DI BROWSER:" -ForegroundColor Cyan
Write-Host ""
Write-Host "PENTING! Lakukan salah satu cara berikut:" -ForegroundColor Yellow
Write-Host ""
Write-Host "CARA 1 - Mode Incognito (PALING MUDAH):" -ForegroundColor White
Write-Host "  1. Tekan Ctrl+Shift+N (Chrome) atau Ctrl+Shift+P (Edge)" -ForegroundColor Gray
Write-Host "  2. Buka http://localhost:3002/login" -ForegroundColor Gray
Write-Host "  3. Login dengan mukhsin9@gmail.com / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "CARA 2 - Clear Browser Storage:" -ForegroundColor White
Write-Host "  1. Buka http://localhost:3002/login" -ForegroundColor Gray
Write-Host "  2. Tekan F12 untuk buka DevTools" -ForegroundColor Gray
Write-Host "  3. Pilih tab 'Application'" -ForegroundColor Gray
Write-Host "  4. Klik 'Clear site data' di sidebar kiri" -ForegroundColor Gray
Write-Host "  5. Refresh halaman (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "  6. Login dengan mukhsin9@gmail.com / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "CARA 3 - Gunakan Tombol di Halaman Login:" -ForegroundColor White
Write-Host "  1. Coba login" -ForegroundColor Gray
Write-Host "  2. Jika gagal, klik tombol 'Bersihkan Storage & Coba Lagi'" -ForegroundColor Gray
Write-Host "  3. Coba login lagi" -ForegroundColor Gray
Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Memulai dev server..." -ForegroundColor Green
Write-Host ""

npm run dev
