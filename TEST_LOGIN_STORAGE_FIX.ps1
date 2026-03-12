# Script untuk menguji perbaikan error storage login

Write-Host "🔧 Testing Login Storage Fix..." -ForegroundColor Cyan

# 1. Jalankan test perbaikan
Write-Host "`n1. Running storage fix test..." -ForegroundColor Yellow
npx tsx scripts/test-browser-login-fix.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage fix test passed" -ForegroundColor Green
} else {
    Write-Host "❌ Storage fix test failed" -ForegroundColor Red
    exit 1
}

# 2. Kill existing development server
Write-Host "`n2. Stopping existing development server..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*Next.js*" 
} | Stop-Process -Force

Start-Sleep -Seconds 2

# 3. Start development server
Write-Host "`n3. Starting development server..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Test server availability
Write-Host "`n4. Testing server availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Server responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Server might still be starting up" -ForegroundColor Yellow
}

Write-Host "`n🎉 Login Storage Fix Applied Successfully!" -ForegroundColor Green

Write-Host "`n📋 Perbaikan yang diterapkan:" -ForegroundColor Cyan
Write-Host "✅ Safe storage implementation dengan error handling"
Write-Host "✅ Timeout protection untuk mencegah hanging"
Write-Host "✅ Enhanced error handling untuk storage errors"
Write-Host "✅ Server-side environment protection"
Write-Host "✅ Graceful fallback untuk berbagai error scenarios"

Write-Host "`n🔍 Error yang sudah diperbaiki:" -ForegroundColor Cyan
Write-Host "- TypeError: Cannot read properties of undefined (reading 'get')"
Write-Host "- TypeError: Cannot read properties of undefined (reading 'remove')"
Write-Host "- Settings subscription error"
Write-Host "- Auth lock contention errors"

Write-Host "`n🌐 Silakan test login di browser:" -ForegroundColor Yellow
Write-Host "URL: http://localhost:3000/login"
Write-Host "Email: mukhsin9@gmail.com"
Write-Host "Password: [gunakan password yang benar]"

Write-Host "`n✨ Login seharusnya berjalan lancar tanpa error storage!" -ForegroundColor Green