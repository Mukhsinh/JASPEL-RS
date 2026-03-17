#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

async function testLoginBrowserFlow() {
  console.log('🔍 Testing Login Browser Flow...\n')

  try {
    // Simulate the exact flow that happens in the browser
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })

    console.log('1️⃣ Clearing any existing session...')
    await supabase.auth.signOut({ scope: 'local' })

    console.log('2️⃣ Attempting login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful')

    // Wait a moment like the browser does
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log('3️⃣ Checking session after delay...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }

    if (!sessionData.session) {
      console.error('❌ No session found after login - this could cause redirect loop!')
      return
    }

    console.log('✅ Session exists after delay')

    // Check if role is in session
    const role = sessionData.session.user.user_metadata?.role
    if (!role) {
      console.error('❌ No role in session - middleware will redirect to login!')
      return
    }

    console.log('✅ Role found in session:', role)

    // Check employee data
    console.log('4️⃣ Fetching employee data...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', sessionData.session.user.id)
      .single()

    if (empError) {
      console.error('❌ Employee fetch error:', empError.message)
      console.error('   This would cause auth service to sign out and redirect to login!')
      return
    }

    if (!employee) {
      console.error('❌ Employee not found - auth service would sign out!')
      return
    }

    if (!employee.is_active) {
      console.error('❌ Employee inactive - auth service would sign out!')
      return
    }

    console.log('✅ Employee data valid:', {
      name: employee.full_name,
      active: employee.is_active
    })

    console.log('\n5️⃣ Testing dashboard route access...')
    
    // The issue might be in the dashboard route itself
    // Let's check if there's a dashboard page
    console.log('   Dashboard route should be: /dashboard')
    console.log('   User should be redirected to: /dashboard')
    
    console.log('\n✅ Login flow appears correct. Issue might be:')
    console.log('   1. Dashboard page doesn\'t exist or has errors')
    console.log('   2. Middleware is incorrectly configured for /dashboard route')
    console.log('   3. Browser storage/cookie issues')
    console.log('   4. Race condition between login and redirect')

    // Clean up
    await supabase.auth.signOut()

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testLoginBrowserFlow()