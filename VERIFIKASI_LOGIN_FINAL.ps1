#!/usr/bin/env pwsh

Write-Host "🔍 Verifikasi Perbaikan Login Final..." -ForegroundColor Cyan
Write-Host ""

# Test backend login
Write-Host "📡 Testing backend login..." -ForegroundColor Yellow
$backendTest = npx tsx scripts/test-login-now.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend login: BERHASIL" -ForegroundColor Green
} else {
    Write-Host "❌ Backend login: GAGAL" -ForegroundColor Red
}

Write-Host ""

# Check if development server is running
$serverRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
if ($serverRunning) {
    Write-Host "✅ Development server: BERJALAN" -ForegroundColor Green
} else {
    Write-Host "❌ Development server: TIDAK BERJALAN" -ForegroundColor Red
    Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "📋 Perbaikan yang Telah Diterapkan:" -ForegroundColor Cyan
Write-Host "   ✅ Fixed dashboard TypeScript error (await createClient())" -ForegroundColor Green
Write-Host "   ✅ Improved login page session handling" -ForegroundColor Green
Write-Host "   ✅ Enhanced localStorage cleanup" -ForegroundColor Green
Write-Host "   ✅ Better error handling and logging" -ForegroundColor Green
Write-Host "   ✅ Force page reload for redirect" -ForegroundColor Green
Write-Host "   ✅ Improved Supabase client configuration" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 SILAKAN TEST LOGIN DI BROWSER:" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3002/login" -ForegroundColor White
Write-Host "   Email: mukhsin9@gmail.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Yang Harus Diperiksa di Browser:" -ForegroundColor Cyan
Write-Host "   1. Halaman login muncul dengan benar" -ForegroundColor White
Write-Host "   2. Form login dapat diisi" -ForegroundColor White
Write-Host "   3. Tombol 'Masuk ke Sistem' berfungsi" -ForegroundColor White
Write-Host "   4. Setelah login berhasil, redirect ke /units (untuk superadmin)" -ForegroundColor White
Write-Host "   5. Tidak ada error di browser console" -ForegroundColor White
Write-Host ""

Write-Host "💡 Jika masih ada masalah:" -ForegroundColor Yellow
Write-Host "   1. Clear browser cache dan cookies" -ForegroundColor White
Write-Host "   2. Coba mode incognito/private" -ForegroundColor White
Write-Host "   3. Periksa browser console untuk error" -ForegroundColor White
Write-Host "   4. Refresh halaman dan coba lagi" -ForegroundColor White
Write-Host ""

Write-Host "✅ Verifikasi selesai - silakan test di browser!" -ForegroundColor Green