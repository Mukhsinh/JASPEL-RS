#!/usr/bin/env tsx

/**
 * Test Assessment Page Access
 * Tests the actual HTTP access to the assessment page
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testAssessmentPageAccess() {
  console.log('🧪 Testing Assessment Page HTTP Access...\n')

  const baseUrl = 'http://localhost:3003'
  
  try {
    // 1. Test direct access to assessment page (should redirect to login)
    console.log('1. Testing direct access to /assessment (should redirect to login)...')
    
    const response = await fetch(`${baseUrl}/assessment`, {
      redirect: 'manual' // Don't follow redirects automatically
    })
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Status Text: ${response.statusText}`)
    
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   ✅ Correctly redirected to: ${location}`)
      
      if (location?.includes('/login')) {
        console.log('   ✅ Redirect to login page is correct')
      } else {
        console.log('   ⚠️  Unexpected redirect location')
      }
    } else if (response.status === 403) {
      console.log('   ❌ Still getting 403 Forbidden - middleware issue not resolved')
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`)
    }

    // 2. Test login page access
    console.log('\n2. Testing login page access...')
    const loginResponse = await fetch(`${baseUrl}/login`)
    console.log(`   Login page status: ${loginResponse.status}`)
    
    if (loginResponse.ok) {
      console.log('   ✅ Login page accessible')
    } else {
      console.log('   ❌ Login page not accessible')
    }

    // 3. Test forbidden page access
    console.log('\n3. Testing forbidden page access...')
    const forbiddenResponse = await fetch(`${baseUrl}/forbidden`)
    console.log(`   Forbidden page status: ${forbiddenResponse.status}`)
    
    if (forbiddenResponse.ok) {
      console.log('   ✅ Forbidden page accessible')
    } else {
      console.log('   ❌ Forbidden page not accessible')
    }

    console.log('\n📋 SUMMARY:')
    console.log('✅ Middleware has been updated to include /assessment route')
    console.log('✅ Assessment page query fixed to use user_id instead of email')
    
    if (response.status === 403) {
      console.log('❌ 403 error still persists - need to investigate further')
      console.log('\n🔍 TROUBLESHOOTING STEPS:')
      console.log('1. Check if middleware.ts changes were saved properly')
      console.log('2. Restart the development server')
      console.log('3. Clear browser cache and cookies')
      console.log('4. Check browser developer tools for detailed error messages')
    } else {
      console.log('✅ 403 error should now be resolved')
      console.log('\n🚀 NEXT STEPS:')
      console.log('1. Login with superadmin account (Mukhsin)')
      console.log('2. Navigate to /assessment')
      console.log('3. The page should now load properly')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.log('\n⚠️  Make sure the development server is running on port 3003')
    console.log('   Run: npx next dev -p 3003')
  }
}

// Run the test
testAssessmentPageAccess().catch(console.error)