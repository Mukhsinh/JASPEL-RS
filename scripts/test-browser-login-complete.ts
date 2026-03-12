#!/usr/bin/env tsx

/**
 * Test the complete login flow including auth service
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Mock Next.js environment for auth service
global.fetch = fetch

async function testCompleteLogin() {
  console.log('🔐 Testing complete login flow...')
  
  try {
    // Import auth service (this will work now that we have the environment)
    const { signIn } = await import('@/lib/services/auth.service')
    
    console.log('📧 Testing login with mukhsin9@gmail.com...')
    
    const result = await signIn('mukhsin9@gmail.com', 'admin123')
    
    if (result.success) {
      console.log('✅ Login successful!')
      console.log('👤 User data:', result.user)
      console.log('🏠 Redirect path:', result.redirectPath)
    } else {
      console.error('❌ Login failed:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCompleteLogin()