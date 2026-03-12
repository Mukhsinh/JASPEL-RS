#!/usr/bin/env pwsh

Write-Host "📄 Manual PDF Export Testing Guide" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`n🔧 Step 1: Configure Settings" -ForegroundColor Yellow
Write-Host "1. Open browser and go to: http://localhost:3000/settings" -ForegroundColor White
Write-Host "2. Fill in the following fields:" -ForegroundColor White
Write-Host "   - Nama Pengembang: [Your Developer Name]" -ForegroundColor Green
Write-Host "   - Nama Organisasi: [Your Organization Name]" -ForegroundColor Green
Write-Host "   - Teks Footer: [Your Footer Text]" -ForegroundColor Green
Write-Host "3. Click 'Simpan Pengaturan'" -ForegroundColor White

Write-Host "`n📊 Step 2: Test KPI Config PDF Export" -ForegroundColor Yellow
Write-Host "1. Go to: http://localhost:3000/kpi-config" -ForegroundColor White
Write-Host "2. Select a unit that has KPI structure configured" -ForegroundColor White
Write-Host "3. Click 'Petunjuk PDF' button" -ForegroundColor Green
Write-Host "   ✓ Should download guide PDF with cover page" -ForegroundColor Gray
Write-Host "   ✓ Cover should show developer name from settings" -ForegroundColor Gray
Write-Host "   ✓ All pages should have footer text from settings" -ForegroundColor Gray
Write-Host "4. Click 'Laporan PDF' button" -ForegroundColor Green
Write-Host "   ✓ Should download KPI structure report PDF" -ForegroundColor Gray
Write-Host "   ✓ Cover page should show developer and organization name" -ForegroundColor Gray
Write-Host "   ✓ All pages should have footer and page numbers" -ForegroundColor Gray

Write-Host "`n🔍 Step 3: Verify PDF Quality" -ForegroundColor Yellow
Write-Host "Check the downloaded PDFs for:" -ForegroundColor White
Write-Host "✓ No overlapping text" -ForegroundColor Green
Write-Host "✓ No code artifacts (like 'P2: Perilaku' overlapping)" -ForegroundColor Green
Write-Host "✓ Proper spacing between sections" -ForegroundColor Green
Write-Host "✓ Consistent font sizes and formatting" -ForegroundColor Green
Write-Host "✓ Tables fit properly within page margins" -ForegroundColor Green
Write-Host "✓ Validation status shows in colors (green for valid, red/orange for invalid)" -ForegroundColor Green
Write-Host "✓ Footer appears on all pages (except cover)" -ForegroundColor Green

Write-Host "`n🚀 Starting Development Server..." -ForegroundColor Blue
Write-Host "If server is not running, it will start now." -ForegroundColor Gray

# Check if server is already running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
    }
} catch {
    # Server not running
}

if ($serverRunning) {
    Write-Host "✅ Development server is already running!" -ForegroundColor Green
} else {
    Write-Host "🔄 Starting development server..." -ForegroundColor Yellow
    Write-Host "Please wait for the server to start, then follow the testing steps above." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

Write-Host "`n🌐 Open these URLs to test:" -ForegroundColor Magenta
Write-Host "Settings: http://localhost:3000/settings" -ForegroundColor Cyan
Write-Host "KPI Config: http://localhost:3000/kpi-config" -ForegroundColor Cyan

Write-Host "`n📝 Expected Results:" -ForegroundColor Yellow
Write-Host "- PDF files should download without errors" -ForegroundColor White
Write-Host "- Cover pages should show developer name and organization" -ForegroundColor White
Write-Host "- Footer text should appear on all content pages" -ForegroundColor White
Write-Host "- No overlapping or garbled text in PDFs" -ForegroundColor White
Write-Host "- Clean, professional formatting throughout" -ForegroundColor White