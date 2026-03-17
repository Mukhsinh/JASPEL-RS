#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseLoginIssue() {
  console.log('🔍 Diagnosing login issue...\n')
  
  try {
    // 1. Test Supabase connection
    console.log('1. Testing Supabase connection...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: healthCheck, error: healthError } = await supabase
      .from('m_employees')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Supabase connection failed:', healthError.message)
      return
    }
    console.log('✅ Supabase connection successful')
    
    // 2. Check if test user exists
    console.log('\n2. Checking test user...')
    const testEmail = 'mukhsin9@gmail.com'
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ Failed to list auth users:', authError.message)
      return
    }
    
    const testUser = authUsers.users.find(u => u.email === testEmail)
    if (!testUser) {
      console.error('❌ Test user not found in auth.users')
      return
    }
    
    console.log('✅ Test user found in auth.users')
    console.log('   - ID:', testUser.id)
    console.log('   - Email:', testUser.email)
    console.log('   - Email confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('   - Created:', testUser.created_at)
    console.log('   - Last sign in:', testUser.last_sign_in_at || 'Never')
    console.log('   - User metadata:', JSON.stringify(testUser.user_metadata, null, 2))
    console.log('   - Raw metadata:', JSON.stringify(testUser.raw_user_meta_data, null, 2))
    
    // 3. Check employee record
    console.log('\n3. Checking employee record...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee record not found:', empError.message)
      
      // Check if there's an employee with the email
      const { data: empByEmail, error: empByEmailError } = await supabase
        .from('m_employees')
        .select('*')
        .eq('email', testEmail)
        .single()
      
      if (empByEmailError) {
        console.error('❌ No employee record with email either:', empByEmailError.message)
      } else {
        console.log('⚠️  Found employee record by email but user_id mismatch:')
        console.log('   - Employee user_id:', empByEmail.user_id)
        console.log('   - Auth user_id:', testUser.id)
        console.log('   - Employee data:', JSON.stringify(empByEmail, null, 2))
      }
      return
    }
    
    console.log('✅ Employee record found')
    console.log('   - Name:', employee.full_name)
    console.log('   - Email:', employee.email)
    console.log('   - Role:', employee.role)
    console.log('   - Active:', employee.is_active)
    console.log('   - Unit ID:', employee.unit_id)
    console.log('   - User ID:', employee.user_id)
    
    // 4. Test login attempt
    console.log('\n4. Testing login attempt...')
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    const { data: loginData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: testEmail,
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      console.error('   - Error code:', loginError.status)
      console.error('   - Full error:', JSON.stringify(loginError, null, 2))
      return
    }
    
    console.log('✅ Login successful!')
    console.log('   - User ID:', loginData.user?.id)
    console.log('   - Email:', loginData.user?.email)
    console.log('   - Session expires:', new Date(loginData.session?.expires_at! * 1000).toLocaleString())
    
    // 5. Test session retrieval
    console.log('\n5. Testing session retrieval...')
    const { data: sessionData, error: sessionError } = await anonSupabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session retrieval failed:', sessionError.message)
      return
    }
    
    if (!sessionData.session) {
      console.error('❌ No session found after login')
      return
    }
    
    console.log('✅ Session retrieved successfully')
    console.log('   - Session valid until:', new Date(sessionData.session.expires_at! * 1000).toLocaleString())
    
    // 6. Test RLS policies
    console.log('\n6. Testing RLS policies...')
    const { data: rls_test, error: rlsError } = await anonSupabase
      .from('m_employees')
      .select('id, full_name, role')
      .eq('user_id', loginData.user?.id)
      .single()
    
    if (rlsError) {
      console.error('❌ RLS test failed:', rlsError.message)
      return
    }
    
    console.log('✅ RLS policies working correctly')
    console.log('   - Can access own employee record')
    
    // Clean up session
    await anonSupabase.auth.signOut()
    console.log('\n✅ Diagnosis complete - login system appears to be working correctly')
    
  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error)
  }
}

diagnoseLoginIssue()