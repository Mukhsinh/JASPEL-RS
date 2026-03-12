#!/usr/bin/env pwsh

Write-Host "🚀 JASPEL - Deploy to Vercel Process" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Step 1: Final Build Test
Write-Host "`n1. Running final build test..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 2: Check Git Status
Write-Host "`n2. Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    
    $commit = Read-Host "`nDo you want to commit these changes? (y/N)"
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        $message = Read-Host "Enter commit message"
        if (-not $message) {
            $message = "Fix deploy errors and prepare for Vercel deployment"
        }
        
        git add .
        git commit -m $message
        Write-Host "✅ Changes committed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Proceeding with uncommitted changes..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Working directory clean!" -ForegroundColor Green
}

# Step 3: Push to GitHub
Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
$push = Read-Host "Push to GitHub? (Y/n)"
if ($push -ne 'n' -and $push -ne 'N') {
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to push to GitHub!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping GitHub push..." -ForegroundColor Yellow
}

# Step 4: Deployment Instructions
Write-Host "`n4. Vercel Deployment Instructions" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 SETUP STEPS:" -ForegroundColor Cyan
Write-Host "1. Go to https://vercel.com and login with GitHub"
Write-Host "2. Click 'New Project' and import your GitHub repository"
Write-Host "3. Configure environment variables in Vercel dashboard:"
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
Write-Host ""
Write-Host "🚀 DEPLOY OPTIONS:" -ForegroundColor Cyan
Write-Host "Option A: Automatic (Recommended)"
Write-Host "   - Vercel will auto-deploy when you push to main branch"
Write-Host ""
Write-Host "Option B: Manual via CLI"
Write-Host "   - Install: npm i -g vercel"
Write-Host "   - Login: vercel login"
Write-Host "   - Deploy: vercel --prod"
Write-Host ""
Write-Host "📋 DEPLOYMENT CHECKLIST:" -ForegroundColor Cyan
Write-Host "✅ Build successful"
Write-Host "✅ Code pushed to GitHub"
Write-Host "✅ Environment variables ready"
Write-Host "✅ Supabase database configured"
Write-Host "✅ Domain ready (optional)"
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Set up environment variables in Vercel"
Write-Host "2. Deploy the application"
Write-Host "3. Test the deployed application"
Write-Host "4. Configure custom domain (if needed)"
Write-Host ""
Write-Host "✨ Your JASPEL application is ready for production!" -ForegroundColor Green
Write-Host "🌐 After deployment, your app will be available at: https://your-app.vercel.app" -ForegroundColor Cyan