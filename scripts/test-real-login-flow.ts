#!/usr/bin/env tsx

/**
 * Test the real login flow using the actual Supabase client setup
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testRealLoginFlow() {
  console.log('🔐 Testing real login flow...')
  
  // Use the same client setup as the app
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  })

  try {
    // 1. Clear any existing session
    console.log('\n1. Clearing existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    
    // 2. Test login
    console.log('\n2. Testing login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError)
      return false
    }
    
    console.log('✅ Login successful')
    console.log('   - User ID:', authData.user.id)
    console.log('   - Email:', authData.user.email)
    console.log('   - Role in metadata:', authData.user.user_metadata?.role)
    
    // 3. Test employee data fetch (this is what the auth service does)
    console.log('\n3. Testing employee data fetch...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active, role')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch failed:', employeeError)
      return false
    }
    
    if (!employeeData) {
      console.error('❌ No employee data found')
      return false
    }
    
    console.log('✅ Employee data fetched successfully')
    console.log('   - Employee ID:', employeeData.id)
    console.log('   - Full Name:', employeeData.full_name)
    console.log('   - Role:', employeeData.role)
    console.log('   - Unit ID:', employeeData.unit_id)
    console.log('   - Active:', employeeData.is_active)
    
    // 4. Test role resolution (what auth service does)
    console.log('\n4. Testing role resolution...')
    const role = employeeData.role || 
                 authData.user.raw_user_meta_data?.role || 
                 authData.user.user_metadata?.role
    
    if (!role) {
      console.error('❌ Role resolution failed')
      return false
    }
    
    console.log('✅ Role resolved:', role)
    
    if (!employeeData.is_active) {
      console.error('❌ Employee is inactive')
      return false
    }
    
    console.log('✅ Employee is active')
    
    // 5. Test session retrieval (what middleware does)
    console.log('\n5. Testing session retrieval...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('❌ No session found')
      return false
    }
    
    console.log('✅ Session found')
    console.log('   - Session user ID:', session.user.id)
    console.log('   - Session role:', session.user.user_metadata?.role)
    
    // 6. Test middleware employee check
    console.log('\n6. Testing middleware employee check...')
    const { data: empForMiddleware, error: midError } = await supabase
      .from('m_employees')
      .select('role, is_active')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle()
    
    if (midError || !empForMiddleware) {
      console.error('❌ Middleware employee check failed:', midError)
      return false
    }
    
    const middlewareRole = empForMiddleware.role || 
                          session.user.raw_user_meta_data?.role || 
                          session.user.user_metadata?.role
    
    if (!middlewareRole) {
      console.error('❌ Middleware role resolution failed')
      return false
    }
    
    if (!empForMiddleware.is_active) {
      console.error('❌ Middleware would reject inactive user')
      return false
    }
    
    console.log('✅ Middleware check passed')
    console.log('   - Middleware role:', middlewareRole)
    console.log('   - Employee active:', empForMiddleware.is_active)
    
    // 7. Clean up
    console.log('\n7. Cleaning up...')
    await supabase.auth.signOut()
    console.log('✅ Logout successful')
    
    console.log('\n🎉 All login flow tests passed!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Login with credentials')
    console.log('   ✅ Employee data fetch')
    console.log('   ✅ Role resolution')
    console.log('   ✅ Active status check')
    console.log('   ✅ Session management')
    console.log('   ✅ Middleware compatibility')
    console.log('   ✅ Logout')
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Run the test
testRealLoginFlow()
  .then(success => {
    if (success) {
      console.log('\n✅ Login flow is working correctly!')
      console.log('🚀 You can now start the development server and test in browser')
      process.exit(0)
    } else {
      console.log('\n❌ Login flow test failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error)
    process.exit(1)
  })