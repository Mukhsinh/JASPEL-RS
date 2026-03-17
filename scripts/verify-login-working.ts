#!/usr/bin/env tsx

/**
 * Verify login is working by testing the auth service directly
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Mock browser environment for client-side code
global.window = {
  location: {
    origin: 'http://localhost:3003',
    hostname: 'localhost'
  }
} as any

global.document = {
  cookie: ''
} as any

global.localStorage = {
  clear: () => {},
  removeItem: () => {},
  getItem: () => null,
  setItem: () => {}
} as any

global.sessionStorage = {
  clear: () => {},
  removeItem: () => {},
  getItem: () => null,
  setItem: () => {}
} as any

async function verifyLogin() {
  console.log('🔐 Verifying login functionality...')
  
  try {
    // Import auth service (this will work now that we have browser globals)
    const { authService } = await import('../lib/services/auth.service')
    
    console.log('\n📧 Testing login with: mukhsin9@gmail.com')
    
    // Test login
    const result = await authService.signIn('mukhsin9@gmail.com', 'admin123')
    
    if (result.success) {
      console.log('✅ Login successful!')
      console.log('   - User ID:', result.user?.id)
      console.log('   - Email:', result.user?.email)
      console.log('   - Role:', result.user?.role)
      console.log('   - Full Name:', result.user?.full_name)
      console.log('   - Unit ID:', result.user?.unit_id)
      console.log('   - Active:', result.user?.is_active)
      
      // Test logout
      console.log('\n🚪 Testing logout...')
      await authService.signOut()
      console.log('✅ Logout successful!')
      
    } else {
      console.error('❌ Login failed:', result.error)
      return false
    }
    
    console.log('\n🎉 All authentication tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

// Run verification
verifyLogin()
  .then(success => {
    if (success) {
      console.log('\n✅ Login is working correctly!')
      process.exit(0)
    } else {
      console.log('\n❌ Login verification failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Verification error:', error)
    process.exit(1)
  })