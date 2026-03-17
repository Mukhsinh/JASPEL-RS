#!/usr/bin/env pwsh

Write-Host "🚀 Testing Pegawai Page After Fix..." -ForegroundColor Green

# Start development server
Write-Host "Starting development server..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the pegawai page
Write-Host "Testing pegawai page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/pegawai" -UseBasicParsing -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Pegawai page loaded successfully!" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error accessing pegawai page: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Manual Testing Instructions:" -ForegroundColor Cyan
Write-Host "1. Open browser to http://localhost:3000" -ForegroundColor White
Write-Host "2. Login with superadmin credentials" -ForegroundColor White
Write-Host "3. Navigate to /pegawai page" -ForegroundColor White
Write-Host "4. Check if data loads without console errors" -ForegroundColor White
Write-Host "5. Test search functionality" -ForegroundColor White
Write-Host "6. Test add/edit pegawai forms" -ForegroundColor White

Write-Host "`n🎯 Expected Results:" -ForegroundColor Cyan
Write-Host "- No console errors about missing columns" -ForegroundColor White
Write-Host "- No auth storage errors" -ForegroundColor White
Write-Host "- No server action errors" -ForegroundColor White
Write-Host "- Data loads properly in table" -ForegroundColor White
Write-Host "- Forms work correctly" -ForegroundColor White

Write-Host "`nPress Ctrl+C to stop the server when done testing." -ForegroundColor Yellow