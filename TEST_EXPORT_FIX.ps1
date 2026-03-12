#!/usr/bin/env pwsh

Write-Host "🔧 Testing Export Fix..." -ForegroundColor Cyan
Write-Host ""

# Start development server in background
Write-Host "1. Starting development server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 10

try {
    # Test if server is running
    Write-Host "2. Checking server status..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        Write-Host "   ✅ Server is running" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Server not responding" -ForegroundColor Red
        exit 1
    }

    # Test export endpoints
    Write-Host "3. Testing export endpoints..." -ForegroundColor Yellow
    npx tsx scripts/test-export-endpoints.ts

    Write-Host ""
    Write-Host "✅ Export fix test completed!" -ForegroundColor Green
}
finally {
    # Stop the server
    Write-Host ""
    Write-Host "4. Stopping development server..." -ForegroundColor Yellow
    if ($serverProcess -and !$serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force
        Write-Host "   ✅ Server stopped" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "- Fixed nested query issue in export endpoint" -ForegroundColor White
Write-Host "- Updated sub indicator handling for new scoring_criteria structure" -ForegroundColor White
Write-Host "- Created comprehensive system guide generator" -ForegroundColor White
Write-Host "- Added guide PDF download endpoint" -ForegroundColor White