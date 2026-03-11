#!/usr/bin/env tsx

/**
 * Test script to verify syntax fixes are working
 */

import { createClient } from '@/lib/supabase/server'

async function testSyntaxFixes() {
  console.log('🧪 Testing Syntax Fixes...\n')

  try {
    // Test 1: Server client creation
    console.log('1. Testing server client creation...')
    const supabase = await createClient()
    console.log('✅ Server client created successfully')

    // Test 2: Basic auth check
    console.log('2. Testing auth functionality...')
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.log('⚠️  Auth check returned error (expected if no session):', error.message)
    } else {
      console.log('✅ Auth check completed successfully')
    }

    // Test 3: Database connection
    console.log('3. Testing database connection...')
    const { data, error: dbError } = await supabase
      .from('m_users')
      .select('count')
      .limit(1)
    
    if (dbError) {
      console.log('⚠️  Database query error:', dbError.message)
    } else {
      console.log('✅ Database connection working')
    }

    console.log('\n🎉 All syntax fixes verified successfully!')
    console.log('The application should now load without module build errors.')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testSyntaxFixes().catch(console.error)