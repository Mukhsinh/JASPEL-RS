#!/usr/bin/env pwsh

Write-Host "🚀 Testing Deploy Readiness..." -ForegroundColor Green

# Run the deploy readiness test
npx tsx scripts/test-deploy-ready.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy test completed successfully!" -ForegroundColor Green
    Write-Host "📋 Summary: Application is ready for Vercel deployment" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deploy test failed!" -ForegroundColor Red
    Write-Host "🔧 Please fix the issues above before deploying" -ForegroundColor Yellow
    exit 1
}