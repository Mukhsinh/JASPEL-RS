#!/usr/bin/env pwsh

Write-Host "🔧 Testing PDF Formatting Fixes..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Create test output directory if it doesn't exist
if (!(Test-Path "test-output")) {
    New-Item -ItemType Directory -Path "test-output" -Force | Out-Null
    Write-Host "📁 Created test-output directory" -ForegroundColor Green
}

# Run the PDF formatting test
Write-Host "`n🧪 Running PDF formatting tests..." -ForegroundColor Yellow
npx tsx scripts/test-pdf-formatting-complete.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PDF formatting tests completed successfully!" -ForegroundColor Green
    
    Write-Host "`n📋 Summary of fixes applied:" -ForegroundColor Cyan
    Write-Host "• Fixed text formatting in info/warning boxes" -ForegroundColor White
    Write-Host "• Added fallback for developer name display" -ForegroundColor White
    Write-Host "• Ensured footer text appears from settings" -ForegroundColor White
    Write-Host "• Improved text readability in colored boxes" -ForegroundColor White
    Write-Host "• Removed unwanted characters and formatting codes" -ForegroundColor White
    
    Write-Host "`n🔍 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check the generated PDF files in test-output folder" -ForegroundColor White
    Write-Host "2. Verify text in boxes is clean and readable" -ForegroundColor White
    Write-Host "3. Confirm developer name appears on cover pages" -ForegroundColor White
    Write-Host "4. Check footer text appears at bottom of pages" -ForegroundColor White
    Write-Host "5. Go to Settings page to configure developer name and footer if needed" -ForegroundColor White
    
    Write-Host "`n📄 Generated test files:" -ForegroundColor Cyan
    if (Test-Path "test-output/system-guide-fixed.pdf") {
        Write-Host "• system-guide-fixed.pdf - System guide with fixed formatting" -ForegroundColor Green
    }
    if (Test-Path "test-output/export-test-fixed.pdf") {
        Write-Host "• export-test-fixed.pdf - Export function test" -ForegroundColor Green
    }
    if (Test-Path "slip-insentif-EMP001-2024-01.pdf") {
        Write-Host "• slip-insentif-EMP001-2024-01.pdf - Incentive slip test" -ForegroundColor Green
    }
    if (Test-Path "rekapitulasi-insentif-2024-01.pdf") {
        Write-Host "• rekapitulasi-insentif-2024-01.pdf - Summary report test" -ForegroundColor Green
    }
    
} else {
    Write-Host "`n❌ PDF formatting tests failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎉 PDF formatting fixes are ready!" -ForegroundColor Green
Write-Host "The text in boxes should now be clean and readable." -ForegroundColor White