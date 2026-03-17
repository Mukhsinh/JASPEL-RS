# Test build locally before deployment
Write-Host "🔧 Testing local build..." -ForegroundColor Green

# Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# Run build
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Test production server
    Write-Host "🚀 Starting production server..." -ForegroundColor Yellow
    Write-Host "📝 Server will start on http://localhost:3002" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor White
    
    npm run start
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Please fix the errors above before deploying." -ForegroundColor Yellow
}