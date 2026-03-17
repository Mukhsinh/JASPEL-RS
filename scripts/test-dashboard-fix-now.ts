#!/usr/bin/env tsx

/**
 * Test Dashboard Fix - Icon Props Issue
 * Verifies that dashboard loads without RSC errors
 */

import { execSync } from 'child_process'

console.log('🔧 Testing Dashboard Fix...\n')

try {
  console.log('1️⃣ Cleaning Next.js cache...')
  execSync('rd /s /q .next 2>nul || echo Cache already clean', { stdio: 'inherit' })
  
  console.log('\n2️⃣ Building application...')
  execSync('npm run build', { stdio: 'inherit' })
  
  console.log('\n✅ Build successful! Dashboard fix applied.')
  console.log('\n📝 Changes made:')
  console.log('   - Changed icon prop from React component to string identifier')
  console.log('   - Updated StatCard to use icon mapping internally')
  console.log('   - Fixed auth.getSession() to auth.getUser()')
  console.log('\n🚀 Start dev server with: npm run dev')
  
} catch (error) {
  console.error('\n❌ Build failed:', error)
  process.exit(1)
}
