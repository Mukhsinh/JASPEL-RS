#!/usr/bin/env pwsh

Write-Host "🔧 TESTING SUB INDICATOR SETELAH PERBAIKAN RLS" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# 1. Verify RLS fix
Write-Host "1️⃣ Verifying RLS fix..." -ForegroundColor Yellow
npx tsx scripts/test-sub-indicator-simple.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ RLS test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2️⃣ Starting development server..." -ForegroundColor Yellow

# 2. Start dev server
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Minimized

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 3. Open browser
Write-Host "3️⃣ Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000/login"

Write-Host ""
Write-Host "🎉 PERBAIKAN SUB INDICATOR RLS SELESAI!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 LANGKAH TESTING:" -ForegroundColor Cyan
Write-Host "1. Login dengan salah satu user berikut:" -ForegroundColor White
Write-Host "   - admin@example.com" -ForegroundColor Gray
Write-Host "   - mukhsin9@gmail.com" -ForegroundColor Gray
Write-Host "   - alice.johnson@example.com" -ForegroundColor Gray
Write-Host "   - john.doe@example.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Buka halaman KPI Config" -ForegroundColor White
Write-Host "3. Pilih indicator 'Efisiensi'" -ForegroundColor White
Write-Host "4. Klik 'Tambah Sub Indikator'" -ForegroundColor White
Write-Host "5. Isi form dan simpan" -ForegroundColor White
Write-Host ""
Write-Host "✅ Error RLS sudah diperbaiki!" -ForegroundColor Green
Write-Host "✅ Semua user sudah memiliki record employee" -ForegroundColor Green
Write-Host "✅ Form sub indicator siap digunakan" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")