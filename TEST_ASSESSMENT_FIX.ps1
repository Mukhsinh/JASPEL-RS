#!/usr/bin/env pwsh

Write-Host "🧪 Testing Assessment Page Fix..." -ForegroundColor Cyan
Write-Host ""

# Start development server
Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev" -WindowStyle Minimized

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test the assessment page
Write-Host "🌐 Testing assessment page access..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/assessment" -Method GET -TimeoutSec 10
    Write-Host "✅ Assessment page accessible - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Assessment page error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API endpoints
Write-Host ""
Write-Host "🔍 Testing API endpoints..." -ForegroundColor Green

$endpoints = @(
    "/api/assessment/status?period=2026-01",
    "/api/assessment/employees?period=2026-01"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$endpoint" -Method GET -TimeoutSec 10
        Write-Host "✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Test completed! Check browser console for any remaining errors." -ForegroundColor Cyan
Write-Host "🌐 Open: http://localhost:3000/assessment" -ForegroundColor Yellow

# Keep script running
Write-Host ""
Write-Host "Press any key to stop the server and exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop the development server
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*next*"} | Stop-Process -Force
Write-Host "🛑 Development server stopped." -ForegroundColor Red