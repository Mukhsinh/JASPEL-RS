# Test Login in Browser
Write-Host "🧪 Testing Login Flow..." -ForegroundColor Cyan
Write-Host ""

# Test backend first
Write-Host "1️⃣ Testing backend authentication..." -ForegroundColor Yellow
npx tsx scripts/test-login-complete-flow.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Backend test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Backend is working correctly" -ForegroundColor Green
Write-Host ""

# Instructions
Write-Host "2️⃣ Browser Testing Instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   SEBELUM LOGIN:" -ForegroundColor Cyan
Write-Host "   1. Buka browser DevTools (F12)" -ForegroundColor White
Write-Host "   2. Pergi ke tab 'Console'" -ForegroundColor White
Write-Host "   3. Pergi ke tab 'Network'" -ForegroundColor White
Write-Host "   4. Pergi ke tab 'Application' > 'Storage'" -ForegroundColor White
Write-Host "   5. Klik 'Clear site data' untuk membersihkan cache" -ForegroundColor White
Write-Host ""
Write-Host "   SAAT LOGIN:" -ForegroundColor Cyan
Write-Host "   1. Perhatikan tab 'Console' untuk log" -ForegroundColor White
Write-Host "   2. Perhatikan tab 'Network' untuk request" -ForegroundColor White
Write-Host "   3. Cari pesan '[LOGIN]' di console" -ForegroundColor White
Write-Host "   4. Cari pesan '[AUTH]' di console" -ForegroundColor White
Write-Host ""
Write-Host "   JIKA LOGIN GAGAL:" -ForegroundColor Cyan
Write-Host "   1. Screenshot console errors" -ForegroundColor White
Write-Host "   2. Screenshot network errors (request yang merah)" -ForegroundColor White
Write-Host "   3. Cek apakah ada redirect ke /dashboard" -ForegroundColor White
Write-Host ""

# Start server
Write-Host "3️⃣ Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Server: http://localhost:3002/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Email: mukhsin9@gmail.com" -ForegroundColor Green
Write-Host "🔑 Password: admin123" -ForegroundColor Green
Write-Host ""
Write-Host "Tekan Ctrl+C untuk stop" -ForegroundColor Yellow
Write-Host ""

npm run dev
