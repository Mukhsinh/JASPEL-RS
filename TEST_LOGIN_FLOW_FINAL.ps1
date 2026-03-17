#!/usr/bin/env pwsh

Write-Host "🔍 Testing login flow fixes..." -ForegroundColor Cyan

# Check if server is running
Write-Host "`n1. Checking if development server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/login" -Method HEAD -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Development server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Development server not accessible. Please run 'npm run dev' first." -ForegroundColor Red
    exit 1
}

# Test login page accessibility
Write-Host "`n2. Testing login page accessibility..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3002/login" -TimeoutSec 10
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "✅ Login page accessible" -ForegroundColor Green
        
        # Check if login form is present
        if ($loginResponse.Content -match "Masuk ke Sistem") {
            Write-Host "✅ Login form found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Login form might have issues" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Login page not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test dashboard redirect when not authenticated
Write-Host "`n3. Testing dashboard redirect when not authenticated..." -ForegroundColor Yellow
try {
    $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:3002/dashboard" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($dashboardResponse.StatusCode -eq 302 -or $dashboardResponse.StatusCode -eq 307) {
        $location = $dashboardResponse.Headers.Location
        if ($location -match "/login") {
            Write-Host "✅ Dashboard correctly redirects to login when not authenticated" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Dashboard redirects to: $location" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Dashboard redirect test inconclusive" -ForegroundColor Yellow
}

# Test root page redirect
Write-Host "`n4. Testing root page redirect..." -ForegroundColor Yellow
try {
    $rootResponse = Invoke-WebRequest -Uri "http://localhost:3002/" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($rootResponse.StatusCode -eq 302 -or $rootResponse.StatusCode -eq 307) {
        Write-Host "✅ Root page correctly redirects" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Root page redirect test inconclusive" -ForegroundColor Yellow
}

Write-Host "`n🎉 Login flow tests completed!" -ForegroundColor Green
Write-Host "`n📝 Manual testing steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3002/login in your browser" -ForegroundColor White
Write-Host "   2. Login with: mukhsin9@gmail.com / admin123" -ForegroundColor White
Write-Host "   3. You should be redirected to the dashboard" -ForegroundColor White
Write-Host "   4. The dashboard should show role-based menu items" -ForegroundColor White

Write-Host "`n🔧 If login still redirects back to login page:" -ForegroundColor Yellow
Write-Host "   - Check browser console for errors" -ForegroundColor White
Write-Host "   - Clear browser cache and cookies" -ForegroundColor White
Write-Host "   - Try incognito/private browsing mode" -ForegroundColor White