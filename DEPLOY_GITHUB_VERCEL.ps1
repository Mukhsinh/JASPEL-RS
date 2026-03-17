# Deploy to GitHub and Vercel
Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a git repository. Initializing..." -ForegroundColor Red
    git init
    git remote add origin https://github.com/yourusername/jaspel-kpi-system.git
}

# Add all files
Write-Host "📁 Adding files to git..." -ForegroundColor Yellow
git add .

# Commit changes
$commitMessage = "Fix build errors and optimize for Vercel deployment"
Write-Host "💾 Committing changes: $commitMessage" -ForegroundColor Yellow
git commit -m "$commitMessage"

# Push to GitHub
Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Push failed. Trying to set upstream..." -ForegroundColor Yellow
    git push -u origin main
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://vercel.com/new" -ForegroundColor White
Write-Host "2. Import your GitHub repository" -ForegroundColor White
Write-Host "3. Add environment variables from .env.local" -ForegroundColor White
Write-Host "4. Deploy!" -ForegroundColor White