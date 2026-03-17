#!/usr/bin/env tsx

/**
 * Test login functionality after RLS policy fix
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration')
  console.log('URL:', supabaseUrl ? '✅' : '❌')
  console.log('Key:', supabaseAnonKey ? '✅' : '❌')
  process.exit(1)
}

async function testLogin() {
  console.log('🔐 Testing login functionality after RLS fix...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Clear any existing session
    await supabase.auth.signOut()
    console.log('✅ Cleared existing session')
    
    // Test login
    console.log('🔑 Attempting login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    if (!authData.user) {
      console.error('❌ No user data returned')
      return
    }
    
    console.log('✅ Authentication successful')
    console.log('👤 User ID:', authData.user.id)
    console.log('📧 Email:', authData.user.email)
    console.log('🏷️ Role:', authData.user.user_metadata?.role || authData.user.raw_user_meta_data?.role)
    
    // Wait for session to be established
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test employee data fetch
    console.log('👥 Fetching employee data...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch error:', employeeError)
      return
    }
    
    if (!employeeData) {
      console.error('❌ No employee data found')
      return
    }
    
    console.log('✅ Employee data fetched successfully')
    console.log('👤 Employee ID:', employeeData.id)
    console.log('📝 Full Name:', employeeData.full_name)
    console.log('🏢 Unit ID:', employeeData.unit_id)
    console.log('✅ Active:', employeeData.is_active)
    
    // Test session validation
    console.log('🔍 Validating session...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session) {
      console.log('✅ Session is valid')
      console.log('⏰ Expires at:', new Date(sessionData.session.expires_at! * 1000).toLocaleString())
    } else {
      console.error('❌ No valid session found')
    }
    
    console.log('\n🎉 Login test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testLogin().catch(console.error)