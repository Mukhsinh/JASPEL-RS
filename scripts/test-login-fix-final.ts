#!/usr/bin/env tsx

/**
 * Test login functionality after fixing RLS functions
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function testLogin() {
  console.log('🔐 Testing login functionality...')
  
  try {
    // Create client directly with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
      console.log('Key:', supabaseKey ? 'Found' : 'Missing')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test login with the credentials from the form
    console.log('📧 Testing login with mukhsin9@gmail.com...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }
    
    if (!authData.user) {
      console.error('❌ No user data returned')
      return
    }
    
    console.log('✅ Login successful!')
    console.log('👤 User ID:', authData.user.id)
    console.log('📧 Email:', authData.user.email)
    console.log('🏷️ Raw metadata:', authData.user.raw_user_meta_data)
    console.log('🏷️ User metadata:', authData.user.user_metadata)
    
    // Test role extraction
    const role = authData.user.raw_user_meta_data?.role || authData.user.user_metadata?.role
    console.log('👑 Extracted role:', role)
    
    // Test employee lookup
    console.log('\n👥 Testing employee lookup...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active, role')
      .eq('user_id', authData.user.id)
      .maybeSingle()
    
    if (employeeError) {
      console.error('❌ Employee lookup failed:', employeeError.message)
    } else if (!employeeData) {
      console.error('❌ No employee record found')
    } else {
      console.log('✅ Employee found:', employeeData)
    }
    
    // Test RLS functions
    console.log('\n🔒 Testing RLS functions...')
    
    const { data: isSuperadmin, error: superadminError } = await supabase
      .rpc('is_superadmin')
    
    if (superadminError) {
      console.error('❌ is_superadmin failed:', superadminError.message)
    } else {
      console.log('✅ is_superadmin result:', isSuperadmin)
    }
    
    const { data: currentEmployee, error: currentEmployeeError } = await supabase
      .rpc('get_current_employee')
    
    if (currentEmployeeError) {
      console.error('❌ get_current_employee failed:', currentEmployeeError.message)
    } else {
      console.log('✅ get_current_employee result:', currentEmployee)
    }
    
    // Clean up
    await supabase.auth.signOut()
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testLogin()