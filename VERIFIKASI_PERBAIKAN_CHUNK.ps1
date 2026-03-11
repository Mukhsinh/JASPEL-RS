# Script untuk memverifikasi perbaikan chunk loading error
Write-Host "🔍 Memverifikasi perbaikan chunk loading error..." -ForegroundColor Green

# Cek apakah server berjalan
Write-Host "`n1. Memeriksa status server..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($processes) {
    Write-Host "   ✅ Server Node.js sedang berjalan" -ForegroundColor Green
    Write-Host "   📍 Akses: http://localhost:3002" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Server tidak berjalan" -ForegroundColor Red
    Write-Host "   💡 Jalankan: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Langkah verifikasi manual:" -ForegroundColor Yellow
Write-Host "   a. Buka browser dan akses: http://localhost:3002" -ForegroundColor White
Write-Host "   b. Buka Developer Tools (tekan F12)" -ForegroundColor White
Write-Host "   c. Pilih tab Console" -ForegroundColor White
Write-Host "   d. Refresh halaman (Ctrl+F5)" -ForegroundColor White

Write-Host "`n3. Yang harus diperiksa:" -ForegroundColor Yellow
Write-Host "   ✅ Tidak ada error 404 untuk file _next/static/" -ForegroundColor Green
Write-Host "   ✅ Tidak ada error 'Loading chunk failed'" -ForegroundColor Green
Write-Host "   ✅ Tidak ada error 'ChunkLoadError'" -ForegroundColor Green
Write-Host "   ✅ Halaman login muncul dengan normal" -ForegroundColor Green

Write-Host "`n4. Perbaikan yang telah dilakukan:" -ForegroundColor Yellow
Write-Host "   • Optimized Next.js configuration" -ForegroundColor White
Write-Host "   • Improved webpack chunk splitting" -ForegroundColor White
Write-Host "   • Added static asset caching headers" -ForegroundColor White
Write-Host "   • Cleaned build cache and dependencies" -ForegroundColor White

Write-Host "`n🎯 Jika masih ada error, jalankan: PERBAIKI_CHUNK_ERROR_SEKARANG.ps1" -ForegroundColor Cyan