#!/usr/bin/env tsx

/**
 * Vercel deployment script with pre-deployment checks
 */

import { execSync } from 'child_process'
import { optimizeBuild } from './optimize-build'

async function deployToVercel() {
  console.log('🚀 Preparing for Vercel deployment...\n')
  
  try {
    // Run build optimization
    await optimizeBuild()
    
    // Check if Vercel CLI is installed
    console.log('\n7️⃣ Checking Vercel CLI...')
    try {
      execSync('vercel --version', { stdio: 'pipe' })
      console.log('✅ Vercel CLI is available')
    } catch (error) {
      console.log('📦 Installing Vercel CLI...')
      execSync('npm install -g vercel', { stdio: 'inherit' })
    }
    
    // Deploy to Vercel
    console.log('\n8️⃣ Deploying to Vercel...')
    const deployCommand = process.argv.includes('--prod') 
      ? 'vercel --prod' 
      : 'vercel'
    
    execSync(deployCommand, { stdio: 'inherit' })
    
    console.log('\n🎉 Deployment completed successfully!')
    
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  deployToVercel().catch(console.error)
}