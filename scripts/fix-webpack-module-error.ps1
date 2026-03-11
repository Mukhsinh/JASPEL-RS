#!/usr/bin/env pwsh

Write-Host "🔧 Fixing Webpack Module Error..." -ForegroundColor Yellow

# Stop any running processes
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean all caches and build artifacts
Write-Host "Cleaning build artifacts and caches..." -ForegroundColor Blue
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }
if (Test-Path ".turbo") { Remove-Item -Recurse -Force ".turbo" }
if (Test-Path "tsconfig.tsbuildinfo") { Remove-Item -Force "tsconfig.tsbuildinfo" }

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force

# Reinstall dependencies with clean slate
Write-Host "Reinstalling dependencies..." -ForegroundColor Blue
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
npm install

# Start development server with legacy mode (more stable)
Write-Host "Starting development server in legacy mode..." -ForegroundColor Green
npm run dev:legacy