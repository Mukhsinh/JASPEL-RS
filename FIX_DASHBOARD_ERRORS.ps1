# Fix Dashboard Errors
# Memperbaiki error pada halaman dashboard

Write-Host "🔧 Memperbaiki Dashboard Errors..." -ForegroundColor Cyan
Write-Host ""

# 1. Jalankan script perbaikan
Write-Host "1️⃣ Menjalankan script perbaikan..." -ForegroundColor Yellow
npx tsx scripts/fix-dashboard-errors.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Script perbaikan gagal" -ForegroundColor Red
    exit 1
}

# 2. Hapus cache Next.js
Write-Host ""
Write-Host "2️⃣ Menghapus cache Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Cache .next dihapus" -ForegroundColor Green
}

# 3. Hapus node_modules/.cache
Write-Host ""
Write-Host "3️⃣ Menghapus cache node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✅ Cache node_modules dihapus" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Perbaikan selesai!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Langkah selanjutnya:" -ForegroundColor Cyan
Write-Host "   1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "   2. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   3. Reload halaman dashboard (Ctrl+F5)" -ForegroundColor White
Write-Host ""
