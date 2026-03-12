#!/usr/bin/env pwsh

Write-Host "🧪 Testing KPI PDF Export Functionality" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with required environment variables" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green

# Run the test
Write-Host "`n🚀 Running PDF export tests..." -ForegroundColor Blue
npx tsx scripts/test-kpi-pdf-export.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PDF export tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ PDF export tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 To test manually:" -ForegroundColor Yellow
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Go to /kpi-config page" -ForegroundColor White
Write-Host "3. Select a unit with KPI structure" -ForegroundColor White
Write-Host "4. Click 'Petunjuk PDF' and 'Laporan PDF' buttons" -ForegroundColor White
Write-Host "5. Verify PDFs have proper cover page with developer name and footer" -ForegroundColor White