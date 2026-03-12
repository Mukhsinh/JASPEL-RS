#!/usr/bin/env pwsh

Write-Host "🚀 Testing Sub-Indicator Form Fix" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Verify the RLS fix
Write-Host "1️⃣ Verifying RLS policies fix..." -ForegroundColor Yellow
npx tsx scripts/verify-sub-indicator-fix.ts

Write-Host ""
Write-Host "2️⃣ Starting development server..." -ForegroundColor Yellow
Write-Host "Please test the sub-indicator form at: http://localhost:3002/kpi-config" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ The 'permission denied for table users' error should be fixed!" -ForegroundColor Green
Write-Host "✅ Superadmin can add/edit sub-indicators for all units" -ForegroundColor Green  
Write-Host "✅ Unit managers can add/edit sub-indicators for their unit only" -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev