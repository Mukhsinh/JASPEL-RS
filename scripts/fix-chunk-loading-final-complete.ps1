#!/usr/bin/env pwsh

Write-Host "🔧 Comprehensive Fix for Static Assets and Chunk Loading..." -ForegroundColor Yellow

# Step 1: Stop all Node processes
Write-Host "1. Stopping all Node.js processes..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clean all build artifacts and caches
Write-Host "2. Cleaning build artifacts and caches..." -ForegroundColor Blue

$pathsToClean = @(
    ".next",
    "node_modules/.cache",
    "tsconfig.tsbuildinfo",
    ".eslintcache"
)

foreach ($path in $pathsToClean) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "   ✅ Removed $path" -ForegroundColor Green
    }
}

# Step 3: Use clean Next.js configuration
Write-Host "3. Applying clean Next.js configuration..." -ForegroundColor Blue
if (Test-Path "next.config.clean.js") {
    Copy-Item "next.config.clean.js" "next.config.js" -Force
    Write-Host "   ✅ Applied clean configuration" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Clean config not found, using existing" -ForegroundColor Yellow
}

# Step 4: Clear npm cache and reinstall
Write-Host "4. Clearing npm cache and reinstalling dependencies..." -ForegroundColor Blue
npm cache clean --force 2>$null

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed node_modules" -ForegroundColor Green
}

Write-Host "   Installing dependencies..." -ForegroundColor Blue
npm install --no-optional --legacy-peer-deps

# Step 5: Verify installation
Write-Host "5. Verifying installation..." -ForegroundColor Blue
if (Test-Path "node_modules/next") {
    Write-Host "   ✅ Next.js installed correctly" -ForegroundColor Green
} else {
    Write-Host "   ❌ Next.js installation failed" -ForegroundColor Red
    exit 1
}

# Step 6: Start development server with clean environment
Write-Host "6. Starting development server..." -ForegroundColor Green
Write-Host "   Server will start on http://localhost:3002" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Cyan

# Set environment variables for clean start
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"

# Start the server
npm run dev