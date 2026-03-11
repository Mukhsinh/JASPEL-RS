#!/usr/bin/env pwsh

Write-Host "🔧 Restarting JASPEL with clean build..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "⏹️  Stopping processes..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null
taskkill /f /im next.exe 2>$null

# Clean build cache
Write-Host "🧹 Cleaning build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# Start development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host "🔑 Login dengan: superadmin / admin123" -ForegroundColor Cyan

npm run dev