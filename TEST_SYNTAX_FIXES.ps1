#!/usr/bin/env pwsh

Write-Host "🔧 Testing Syntax Fixes..." -ForegroundColor Cyan
Write-Host ""

# Kill any existing dev server
Write-Host "1. Stopping existing dev server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next dev*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "2. Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# Start dev server in background
Write-Host "3. Starting dev server..." -ForegroundColor Yellow
$devServer = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

# Wait for server to start
Write-Host "4. Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the KPI config endpoint
Write-Host "5. Testing KPI config endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/kpi-config" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
        Write-Host "✅ KPI config endpoint responding (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  KPI config endpoint returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ KPI config endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test the main page
Write-Host "6. Testing main application page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
        Write-Host "✅ Main page responding (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Main page returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Main page test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Syntax fixes testing completed!" -ForegroundColor Green
Write-Host "The application should now be running without module build errors." -ForegroundColor Green
Write-Host "Check your browser at http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop the dev server..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop dev server
Write-Host "Stopping dev server..." -ForegroundColor Yellow
$devServer | Stop-Process -Force
Write-Host "Done!" -ForegroundColor Green