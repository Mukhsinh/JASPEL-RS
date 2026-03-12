#!/usr/bin/env pwsh

Write-Host "🔧 Fixing Static Assets Loading Issues..." -ForegroundColor Yellow

# Stop any running Next.js processes
Write-Host "Stopping existing Next.js processes..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean all build artifacts
Write-Host "Cleaning build artifacts..." -ForegroundColor Blue
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared node_modules cache" -ForegroundColor Green
}

if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed TypeScript build info" -ForegroundColor Green
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force 2>$null

# Reinstall dependencies to ensure clean state
Write-Host "Reinstalling dependencies..." -ForegroundColor Blue
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
npm install

Write-Host "🚀 Starting development server..." -ForegroundColor Green
npm run dev