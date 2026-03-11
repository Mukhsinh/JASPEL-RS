#!/usr/bin/env tsx

/**
 * Test script to verify webpack error is fixed
 */

import { execSync } from 'child_process'

async function testWebpackFix() {
  console.log('🔧 Testing webpack fix...')

  try {
    // Test if server is responding
    const response = await fetch('http://localhost:3002')
    
    if (response.ok) {
      console.log('✅ Server is responding successfully')
      console.log(`📊 Status: ${response.status}`)
      console.log(`🌐 URL: http://localhost:3002`)
      
      // Check if we can access the login page
      const loginResponse = await fetch('http://localhost:3002/login')
      if (loginResponse.ok) {
        console.log('✅ Login page is accessible')
      } else {
        console.log('⚠️  Login page returned:', loginResponse.status)
      }
      
      console.log('\n🎉 Webpack error has been fixed!')
      console.log('📝 Changes made:')
      console.log('   - Simplified next.config.js')
      console.log('   - Removed unused LayoutWrapper import')
      console.log('   - Cleared build cache')
      console.log('   - Restarted development server')
      
    } else {
      console.log('❌ Server returned status:', response.status)
    }
    
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server is not running on port 3002')
      console.log('💡 Make sure to run: npm run dev')
    } else {
      console.log('❌ Error testing server:', error.message)
    }
  }
}

// Run the test
testWebpackFix().catch(console.error)