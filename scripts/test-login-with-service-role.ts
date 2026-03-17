#!/usr/bin/env tsx

/**
 * Test login using service role to bypass RLS and see what's happening
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testLoginWithServiceRole() {
  console.log('🔐 Testing login with service role...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Test normal user login to get JWT
    console.log('\n1. Testing user login to inspect JWT...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError)
      return
    }
    
    console.log('✅ Login successful')
    console.log('   - User ID:', authData.user.id)
    console.log('   - Email:', authData.user.email)
    console.log('   - user_metadata:', JSON.stringify(authData.user.user_metadata, null, 2))
    console.log('   - raw_user_meta_data:', JSON.stringify(authData.user.raw_user_meta_data, null, 2))
    
    // 2. Test employee fetch with user session (will use RLS)
    console.log('\n2. Testing employee fetch with user session (RLS enabled)...')
    
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Set the session manually
    await userSupabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    })
    
    const { data: employeeWithRLS, error: rlsError } = await userSupabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, is_active, user_id')
      .eq('user_id', authData.user.id)
      .single()
    
    if (rlsError) {
      console.error('❌ Employee fetch with RLS failed:', rlsError)
    } else {
      console.log('✅ Employee fetch with RLS successful:', employeeWithRLS)
    }
    
    // 3. Test employee fetch with service role (bypasses RLS)
    console.log('\n3. Testing employee fetch with service role (RLS bypassed)...')
    
    const { data: employeeNoRLS, error: noRlsError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, is_active, user_id')
      .eq('user_id', authData.user.id)
      .single()
    
    if (noRlsError) {
      console.error('❌ Employee fetch without RLS failed:', noRlsError)
    } else {
      console.log('✅ Employee fetch without RLS successful:', employeeNoRLS)
    }
    
    // 4. Check JWT content
    console.log('\n4. Checking JWT content...')
    const { data: { user } } = await userSupabase.auth.getUser()
    if (user) {
      console.log('   - JWT user_metadata:', JSON.stringify(user.user_metadata, null, 2))
      console.log('   - JWT raw_user_meta_data:', JSON.stringify(user.raw_user_meta_data, null, 2))
    }
    
    // Clean up
    await supabase.auth.signOut()
    await userSupabase.auth.signOut()
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testLoginWithServiceRole().catch(console.error)