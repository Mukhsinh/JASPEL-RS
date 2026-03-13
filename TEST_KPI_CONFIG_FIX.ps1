#!/usr/bin/env pwsh

Write-Host "=== TEST KPI CONFIG FIX ===" -ForegroundColor Cyan
Write-Host ""

# Stop any running dev server
Write-Host "Stopping existing dev server..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "✓ Server stopped" -ForegroundColor Green
Write-Host ""

# Start dev server in background
Write-Host "Starting dev server..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "✓ Server started" -ForegroundColor Green
Write-Host ""

# Test the API endpoint
Write-Host "Testing KPI Config API..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/kpi-config" -Method GET -UseBasicParsing -ErrorAction Stop
    
    Write-Host "✅ API Response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    
    Write-Host "=== TEST PASSED ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ API endpoint working correctly" -ForegroundColor Green
    Write-Host "✓ No more 500 errors" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now access: http://localhost:3002/kpi-config" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ API Test Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Press any key to stop the server..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop the dev server
Write-Host ""
Write-Host "Stopping dev server..." -ForegroundColor Yellow
Stop-Job -Job $job
Remove-Job -Job $job
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✓ Server stopped" -ForegroundColor Green
