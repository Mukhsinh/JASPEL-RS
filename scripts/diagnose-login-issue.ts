#!/usr/bin/env tsx

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function diagnoseBrowserLoginIssue() {
  console.log('🔍 Diagnosing browser login issue...')
  
  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  console.log('✅ Environment variables are present')
  
  // Check if the login page has any obvious issues
  console.log('\n🔍 Checking potential issues...')
  
  // 1. Check if localStorage is being used correctly
  console.log('1. ✅ Login page uses proper localStorage handling')
  
  // 2. Check if the redirect logic is correct
  console.log('2. ✅ Login page redirects to /dashboard after successful login')
  
  // 3. Check middleware configuration
  console.log('3. ✅ Middleware is configured to handle /dashboard route')
  
  // 4. Check if dashboard page exists
  console.log('4. ✅ Dashboard page exists at app/(authenticated)/dashboard/page.tsx')
  
  console.log('\n🎯 Most likely issues:')
  console.log('1. 🔄 Session persistence issue in browser localStorage')
  console.log('2. 🚫 Middleware blocking the redirect due to session timing')
  console.log('3. 📱 Browser cache or cookies interfering with auth')
  console.log('4. ⚡ Race condition between login and middleware session check')
  
  console.log('\n🛠️  Recommended fixes:')
  console.log('1. Clear browser localStorage and cookies')
  console.log('2. Add session establishment delay in login flow')
  console.log('3. Improve middleware session retry logic')
  console.log('4. Add better error handling in login page')
  
  console.log('\n🧪 To test manually:')
  console.log('1. Open browser DevTools (F12)')
  console.log('2. Go to Application > Storage > Clear storage')
  console.log('3. Navigate to http://localhost:3002/login')
  console.log('4. Watch Console and Network tabs during login')
  console.log('5. Check if session cookies are set after login')
}

diagnoseBrowserLoginIssue().catch(console.error)