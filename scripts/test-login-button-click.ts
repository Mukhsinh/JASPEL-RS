#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginButtonClick() {
  console.log('🔍 Testing exact login button click behavior...')
  
  // Create client exactly like the login page does
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })
  
  try {
    console.log('\n1. Simulating form submission...')
    
    // Step 1: Clear existing session (exactly like login page)
    await supabase.auth.signOut({ scope: 'local' })
    console.log('✅ Session cleared')
    
    // Step 2: Login with exact same parameters
    const email = 'mukhsin9@gmail.com'
    const password = 'admin123'
    
    console.log(`\n2. Logging in with: ${email}`)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })

    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError?.message || 'No user returned')
      return
    }

    console.log('✅ Login successful, user ID:', authData.user.id)

    // Step 3: Check session availability (exactly like login page)
    if (authData.session) {
      console.log('✅ Session available immediately')
      
      // Step 4: Verify employee data (exactly like login page)
      const { data: employeeData, error: employeeError } = await supabase
        .from('m_employees')
        .select('id, full_name, is_active')
        .eq('user_id', authData.user.id)
        .single()
      
      if (employeeError || !employeeData) {
        console.error('❌ Employee data not found:', employeeError?.message)
        return
      }
      
      if (!employeeData.is_active) {
        console.error('❌ Employee is inactive')
        return
      }
      
      console.log('✅ Employee verified:', employeeData.full_name)
      console.log('✅ Ready to redirect to /dashboard')
      
      // Test what happens after redirect
      console.log('\n3. Testing post-login session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session check failed:', sessionError.message)
        return
      }
      
      if (!session) {
        console.error('❌ Session lost after login')
        return
      }
      
      console.log('✅ Session persists after login')
      console.log('   - User ID:', session.user.id)
      console.log('   - Role:', session.user.user_metadata?.role)
      
    } else {
      console.error('❌ No session in auth response')
    }
    
  } catch (err) {
    console.error('❌ Exception during login simulation:', err)
  }
}

testLoginButtonClick().catch(console.error)