# Fix Dashboard 500 Error
Write-Host "🔧 Memperbaiki Dashboard Error 500..." -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Perbaikan yang dilakukan:" -ForegroundColor Green
Write-Host "1. Mengubah t_audit_logs menjadi t_audit_log" -ForegroundColor White
Write-Host "2. Mengubah final_score menjadi score" -ForegroundColor White
Write-Host "3. Memperbaiki ambiguitas relationship m_employees-t_kpi_assessments" -ForegroundColor White
Write-Host "4. Mengoptimalkan query untuk performa lebih baik" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Menjalankan test..." -ForegroundColor Yellow
npx tsx scripts/test-dashboard-fix.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Test berhasil! Silakan restart server dan test di browser." -ForegroundColor Green
    Write-Host ""
    Write-Host "Untuk restart server:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Kemudian buka: http://localhost:3002/dashboard" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Test gagal. Periksa error di atas." -ForegroundColor Red
}
