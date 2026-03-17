#!/usr/bin/env tsx

/**
 * Test script to verify login session establishment
 */

import { config } from 'dotenv'
import { createBrowserClient } from '@supabase/ssr'

// Load environment variables
config({ path: '.env.local' })

function createTestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase environment variables not found')
    console.error('URL:', url ? 'Found' : 'Missing')
    console.error('Key:', key ? 'Found' : 'Missing')
    throw new Error('Supabase configuration missing')
  }
  
  return createBrowserClient(url, key)
}

async function testLoginSession() {
  console.log('🔍 Testing login session establishment...')
  
  try {
    const supabase = createTestClient()
    
    // Test credentials
    const email = 'mukhsin9@gmail.com'
    const password = 'admin123'
    
    console.log('1. Clearing any existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    
    console.log('2. Attempting login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })
    
    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError)
      return
    }
    
    console.log('✅ Login successful, user ID:', authData.user.id)
    
    // Check session immediately
    console.log('3. Checking session immediately after login...')
    const { data: { session: immediateSession } } = await supabase.auth.getSession()
    
    if (immediateSession) {
      console.log('✅ Session available immediately')
      console.log('   - User ID:', immediateSession.user.id)
      console.log('   - Email:', immediateSession.user.email)
      console.log('   - Role:', immediateSession.user.user_metadata?.role)
    } else {
      console.log('❌ Session not available immediately')
    }
    
    // Test employee data fetch
    console.log('4. Testing employee data fetch...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch error:', employeeError)
    } else if (employeeData) {
      console.log('✅ Employee data found:', {
        id: employeeData.id,
        name: employeeData.full_name,
        active: employeeData.is_active
      })
    } else {
      console.log('❌ No employee data found')
    }
    
    console.log('5. Testing session persistence...')
    // Wait a bit and check session again
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session: persistentSession } } = await supabase.auth.getSession()
    
    if (persistentSession) {
      console.log('✅ Session persisted after delay')
    } else {
      console.log('❌ Session lost after delay')
    }
    
    console.log('✅ Login session test completed')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testLoginSession().catch(console.error)