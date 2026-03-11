#!/usr/bin/env pwsh

Write-Host "🔧 MEMPERBAIKI ERROR DEPLOY VERCEL" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 MASALAH YANG DIPERBAIKI:" -ForegroundColor Yellow
Write-Host "✅ Type conflict KPISubIndicator - field weight vs weight_percentage" -ForegroundColor Green
Write-Host "✅ Type conflict KPICategory - field type vs category" -ForegroundColor Green
Write-Host "✅ Missing properties di interface KPICategory" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 PERBAIKAN YANG DILAKUKAN:" -ForegroundColor Cyan
Write-Host "1. Membuat lib/types/kpi.types.ts dengan tipe yang konsisten" -ForegroundColor White
Write-Host "2. Memperbaiki SubIndicatorFormDialog.tsx menggunakan tipe yang benar" -ForegroundColor White
Write-Host "3. Memperbaiki KPICategory interface sesuai database schema" -ForegroundColor White
Write-Host "4. Menghapus duplicate interface definitions" -ForegroundColor White
Write-Host ""

Write-Host "🧪 TESTING BUILD..." -ForegroundColor Yellow
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ BUILD BERHASIL!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 SIAP DEPLOY KE VERCEL!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 LANGKAH SELANJUTNYA:" -ForegroundColor Cyan
        Write-Host "1. Commit dan push ke GitHub" -ForegroundColor White
        Write-Host "2. Vercel akan otomatis deploy" -ForegroundColor White
        Write-Host "3. Monitor deployment di Vercel dashboard" -ForegroundColor White
    } else {
        Write-Host "❌ BUILD MASIH ERROR" -ForegroundColor Red
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERROR SAAT BUILD: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Script selesai!" -ForegroundColor Green