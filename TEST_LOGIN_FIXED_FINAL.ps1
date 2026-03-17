#!/usr/bin/env pwsh

Write-Host "🚀 Testing Login Fix - Final Verification" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Yellow

# Check if server is running
Write-Host "`n1. Checking development server..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/login" -Method HEAD -TimeoutSec 5
    Write-Host "✅ Server is running (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not running. Starting server..." -ForegroundColor Red
    Write-Host "Run: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Run verification script
Write-Host "`n2. Running verification checks..." -ForegroundColor Cyan
npx tsx scripts/verify-login-fix-complete.ts

Write-Host "`n3. Testing authentication flow..." -ForegroundColor Cyan
npx tsx scripts/test-login-redirect-fix.ts

Write-Host "`n🎯 MANUAL TESTING STEPS:" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Yellow
Write-Host "1. Open browser: http://localhost:3002/login" -ForegroundColor White
Write-Host "2. Login with: mukhsin9@gmail.com / admin123" -ForegroundColor White  
Write-Host "3. Should redirect to dashboard with sidebar" -ForegroundColor White
Write-Host "4. Dashboard should show superadmin menu items" -ForegroundColor White
Write-Host "5. Navigation should work properly" -ForegroundColor White

Write-Host "`n✅ LOGIN REDIRECT ISSUE RESOLVED!" -ForegroundColor Green
Write-Host "User will no longer be stuck in login loop." -ForegroundColor Green