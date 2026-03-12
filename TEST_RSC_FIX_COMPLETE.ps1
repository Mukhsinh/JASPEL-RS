#!/usr/bin/env pwsh

Write-Host "🧪 Testing RSC Fix dan Restart Aplikasi..." -ForegroundColor Cyan

try {
    # 1. Test perbaikan RSC
    Write-Host "`n1. Testing perbaikan RSC..." -ForegroundColor Yellow
    npx tsx scripts/test-rsc-fix.ts
    
    if ($LASTEXITCODE -ne 0) {
        throw "Test RSC fix gagal"
    }

    # 2. Jalankan perbaikan RSC
    Write-Host "`n2. Menjalankan perbaikan RSC..." -ForegroundColor Yellow
    npx tsx scripts/fix-rsc-error.ts
    
    if ($LASTEXITCODE -ne 0) {
        throw "Perbaikan RSC gagal"
    }

    # 3. Test aplikasi dengan development server
    Write-Host "`n3. Memulai development server untuk test..." -ForegroundColor Yellow
    Write-Host "   🌐 Server: http://localhost:3002" -ForegroundColor Green
    Write-Host "   🔑 Login: superadmin / admin123" -ForegroundColor Green
    Write-Host "   ⚡ RSC Error: Fixed" -ForegroundColor Green
    Write-Host "`n   Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
    
    # Start development server
    npm run dev

} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 Solusi alternatif:" -ForegroundColor Yellow
    Write-Host "   1. Jalankan: npm run build" -ForegroundColor Gray
    Write-Host "   2. Jalankan: npm run start" -ForegroundColor Gray
    Write-Host "   3. Atau restart dengan: npm run dev:legacy" -ForegroundColor Gray
    exit 1
}