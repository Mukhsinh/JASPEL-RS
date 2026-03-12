# Fix Login Browser Issue
Write-Host "🔧 Memperbaiki masalah login di browser..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify backend
Write-Host "1️⃣ Memverifikasi backend..." -ForegroundColor Yellow
npx tsx scripts/test-login-complete-flow.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend test gagal!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Backend berfungsi dengan baik" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions for browser
Write-Host "2️⃣ Langkah-langkah untuk memperbaiki di browser:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   A. Buka browser DevTools (tekan F12)" -ForegroundColor White
Write-Host "   B. Pergi ke tab 'Application' atau 'Storage'" -ForegroundColor White
Write-Host "   C. Klik 'Clear site data' atau:" -ForegroundColor White
Write-Host "      - Hapus semua di 'Local Storage'" -ForegroundColor White
Write-Host "      - Hapus semua di 'Session Storage'" -ForegroundColor White
Write-Host "      - Hapus semua 'Cookies'" -ForegroundColor White
Write-Host "   D. Tutup DevTools" -ForegroundColor White
Write-Host "   E. Refresh halaman (Ctrl+Shift+R untuk hard refresh)" -ForegroundColor White
Write-Host "   F. Coba login lagi" -ForegroundColor White
Write-Host ""

# Step 3: Start dev server
Write-Host "3️⃣ Memulai development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server akan dimulai di: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Kredensial login:" -ForegroundColor Cyan
Write-Host "  Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Yellow
Write-Host ""

npm run dev
