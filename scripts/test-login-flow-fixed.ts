#!/usr/bin/env tsx

/**
 * Test script to verify the login flow is working correctly
 * This script tests the complete authentication flow
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

async function testLoginFlow() {
  console.log('🔍 Testing login flow...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key length:', supabaseKey.length)
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError || !authData.user) {
      console.error('❌ Authentication failed:', authError)
      return
    }
    
    console.log('✅ Authentication successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Role:', authData.user.user_metadata?.role)
    
    // 2. Test employee data fetch
    console.log('\n2. Testing employee data fetch...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id, m_units(name)')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError || !employee) {
      console.error('❌ Employee fetch failed:', employeeError)
      return
    }
    
    console.log('✅ Employee data found')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    console.log('   Unit:', employee.m_units?.name || 'No unit')
    
    // 3. Test session persistence
    console.log('\n3. Testing session persistence...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError)
      return
    }
    
    console.log('✅ Session persisted')
    console.log('   Access token length:', session.access_token.length)
    console.log('   Expires at:', new Date(session.expires_at! * 1000).toLocaleString())
    
    // 4. Clean up
    console.log('\n4. Cleaning up...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')
    
    console.log('\n🎉 All tests passed! Login flow is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testLoginFlow().catch(console.error)