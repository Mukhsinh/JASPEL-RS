#!/usr/bin/env pwsh

# Test Assessment Employees Fix
# This script applies the RLS fixes and tests the assessment page

Write-Host "🔧 Fixing Assessment Employees Display Issue..." -ForegroundColor Cyan
Write-Host ""

# Apply the migration and test
Write-Host "📋 Running fix script..." -ForegroundColor Yellow
npx tsx scripts/fix-assessment-employees-display.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🚀 Starting development server to test..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Test Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open browser to http://localhost:3002" -ForegroundColor White
    Write-Host "2. Login as superadmin (admin@example.com / admin123)" -ForegroundColor White
    Write-Host "3. Navigate to 'Penilaian KPI' page" -ForegroundColor White
    Write-Host "4. Select period '2026-01' from dropdown" -ForegroundColor White
    Write-Host "5. Verify that employee data is now displayed" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server when testing is complete" -ForegroundColor Yellow
    Write-Host ""
    
    # Start the development server
    npm run dev
} else {
    Write-Host "❌ Fix script failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}