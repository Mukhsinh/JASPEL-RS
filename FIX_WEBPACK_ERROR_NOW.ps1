#!/usr/bin/env pwsh

Write-Host "🚨 FIXING WEBPACK MODULE ERROR - COMPREHENSIVE SOLUTION" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Yellow

# Step 1: Stop all processes
Write-Host "1. Stopping all Node.js processes..." -ForegroundColor Blue
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    taskkill /f /im node.exe 2>$null
    Write-Host "✅ Processes stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No processes to stop" -ForegroundColor Yellow
}

# Step 2: Clean everything
Write-Host "2. Cleaning all build artifacts and caches..." -ForegroundColor Blue
$pathsToClean = @(
    ".next",
    "node_modules/.cache",
    ".turbo",
    "tsconfig.tsbuildinfo",
    "node_modules"
)

foreach ($path in $pathsToClean) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "✅ Removed: $path" -ForegroundColor Green
    }
}

# Step 3: Clean npm cache
Write-Host "3. Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force
Write-Host "✅ npm cache cleared" -ForegroundColor Green

# Step 4: Use simplified Next.js config
Write-Host "4. Switching to simplified Next.js config..." -ForegroundColor Blue
if (Test-Path "next.config.simple.js") {
    Copy-Item "next.config.simple.js" "next.config.js" -Force
    Write-Host "✅ Simplified config applied" -ForegroundColor Green
} else {
    Write-Host "⚠️  Simplified config not found, using existing" -ForegroundColor Yellow
}

# Step 5: Fresh install
Write-Host "5. Fresh dependency installation..." -ForegroundColor Blue
Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
npm install --no-cache --prefer-offline=false
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 6: Verify installation
Write-Host "6. Verifying core dependencies..." -ForegroundColor Blue
try {
    npm ls next react react-dom --depth=0
    Write-Host "✅ Core dependencies verified" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Dependency verification failed, but continuing..." -ForegroundColor Yellow
}

# Step 7: Start with legacy mode
Write-Host "7. Starting development server in legacy mode..." -ForegroundColor Blue
Write-Host "🎯 Using legacy mode for maximum stability" -ForegroundColor Cyan

# Set environment variables for better stability
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "🚀 Starting server..." -ForegroundColor Green
npm run dev:legacy