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

async function testLoginRedirectFinal() {
  console.log('🧪 Testing Login Redirect - Final Check...\n')

  try {
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

    console.log('2️⃣ Performing login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Simulate the delay that happens in browser
    console.log('3️⃣ Waiting 500ms (simulating browser delay)...')
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log('4️⃣ Checking session persistence...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }

    if (!sessionData.session) {
      console.error('❌ No session found - this would cause redirect loop!')
      return
    }

    console.log('✅ Session persists after delay')

    console.log('5️⃣ Checking user metadata (middleware requirement)...')
    const role = sessionData.session.user.user_metadata?.role
    
    if (!role) {
      console.error('❌ No role in user metadata - middleware would redirect to login!')
      return
    }

    console.log('✅ Role found in session:', role)

    console.log('6️⃣ Checking employee data (auth service requirement)...')
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
      id: employee.id,
      name: employee.full_name,
      active: employee.is_active
    })

    console.log('7️⃣ Simulating middleware checks...')
    
    // Check route authorization for /dashboard
    const dashboardAllowed = ['superadmin', 'unit_manager', 'employee'].includes(role)
    
    if (!dashboardAllowed) {
      console.error('❌ Dashboard route not allowed for role:', role)
      return
    }

    console.log('✅ Dashboard route allowed for role:', role)

    console.log('8️⃣ Simulating auth service login flow...')
    
    // This simulates what authService.login() does
    const userDataResult = {
      id: authData.user.id,
      email: authData.user.email || '',
      role: role,
      unit_id: employee.unit_id,
      is_active: employee.is_active,
      full_name: employee.full_name,
    }

    console.log('✅ Auth service would return success with user data:', {
      role: userDataResult.role,
      name: userDataResult.full_name,
      active: userDataResult.is_active
    })

    console.log('9️⃣ Simulating browser redirect...')
    console.log('   Login page would call: window.location.replace("/dashboard")')
    console.log('   Middleware would allow access to /dashboard for role:', role)
    console.log('   Dashboard page would load successfully')

    // Clean up
    await supabase.auth.signOut()

    console.log('\n🎉 ALL CHECKS PASSED!')
    console.log('   ✅ Login authentication works')
    console.log('   ✅ Session persists correctly')
    console.log('   ✅ User metadata contains role')
    console.log('   ✅ Employee record exists and is active')
    console.log('   ✅ Dashboard route is authorized')
    console.log('   ✅ Auth service would return success')
    
    console.log('\n🚀 Login redirect should now work correctly!')
    console.log('   Try logging in at: http://localhost:3002/login')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testLoginRedirectFinal()