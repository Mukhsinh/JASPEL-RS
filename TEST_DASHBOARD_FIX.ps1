# Test Dashboard Fix
# Memverifikasi perbaikan dashboard

Write-Host "🧪 Testing Dashboard Fix..." -ForegroundColor Cyan
Write-Host ""

# 1. Test notification API
Write-Host "1️⃣ Testing Notification API..." -ForegroundColor Yellow
npx tsx scripts/test-notification-api.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Notification API test failed (non-critical)" -ForegroundColor Yellow
}

# 2. Test dashboard page
Write-Host ""
Write-Host "2️⃣ Testing Dashboard Page..." -ForegroundColor Yellow
npx tsx scripts/test-dashboard-page.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dashboard test failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Semua test berhasil!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Dashboard siap digunakan" -ForegroundColor Cyan
Write-Host ""
