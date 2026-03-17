/**
 * Test complete login flow simulating browser behavior
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testCompleteBrowserLogin() {
  console.log('🌐 TESTING COMPLETE BROWSER LOGIN FLOW\n')
  console.log('=' .repeat(60))

  // Simulate browser client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => {
          // Simulate localStorage
          return null
        },
        setItem: (key, value) => {
          console.log(`[STORAGE] Set: ${key}`)
        },
        removeItem: (key) => {
          console.log(`[STORAGE] Remove: ${key}`)
        },
      },
    },
  })

  try {
    // Step 1: Initial state
    console.log('\n1️⃣ INITIAL STATE')
    console.log('-'.repeat(60))
    const { data: { session: initialSession } } = await supabase.auth.getSession()
    console.log('Initial session:', initialSession ? '✅ Exists' : '❌ None')

    // Step 2: Login
    console.log('\n2️⃣ LOGIN ATTEMPT')
    console.log('-'.repeat(60))
    console.log('Attempting login with: mukhsin9@gmail.com')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    if (!authData.user || !authData.session) {
      console.error('❌ No user or session returned')
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Role (metadata):', authData.user.user_metadata?.role)
    console.log('   Session expires:', new Date(authData.session.expires_at! * 1000).toLocaleString())

    // Step 3: Verify session immediately
    console.log('\n3️⃣ IMMEDIATE SESSION VERIFICATION')
    console.log('-'.repeat(60))
    const { data: { session: verifySession } } = await supabase.auth.getSession()
    
    if (!verifySession) {
      console.error('❌ Session lost immediately after login!')
      return
    }
    
    console.log('✅ Session verified')
    console.log('   User ID matches:', verifySession.user.id === authData.user.id)

    // Step 4: Fetch employee data (simulating middleware)
    console.log('\n4️⃣ FETCHING EMPLOYEE DATA (Middleware simulation)')
    console.log('-'.repeat(60))
    
    // Check role from user_metadata
    const role = verifySession.user.user_metadata?.role
    console.log('Role from metadata:', role || '❌ NOT FOUND')
    
    if (!role) {
      console.error('❌ CRITICAL: Role missing from user_metadata!')
      console.error('   Middleware will fail and redirect to login')
      return
    }

    // Fetch employee record
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id')
      .eq('user_id', verifySession.user.id)
      .maybeSingle()
    
    if (empError) {
      console.error('❌ Employee fetch error:', empError.message)
      console.error('   Middleware will redirect to login')
      return
    }

    if (!employee) {
      console.error('❌ Employee record not found')
      console.error('   Middleware will redirect to login')
      return
    }

    if (!employee.is_active) {
      console.error('❌ Employee is inactive')
      console.error('   Middleware will redirect to login')
      return
    }

    console.log('✅ Employee data fetched successfully')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    console.log('   Role matches metadata:', employee.role === role)

    // Step 5: Simulate dashboard page load
    console.log('\n5️⃣ DASHBOARD PAGE LOAD SIMULATION')
    console.log('-'.repeat(60))
    
    const { data: { session: dashSession } } = await supabase.auth.getSession()
    
    if (!dashSession) {
      console.error('❌ Session lost before dashboard load!')
      return
    }

    console.log('✅ Session still valid')
    
    // Fetch employee with unit (like dashboard does)
    const { data: dashEmployee, error: dashError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, m_units(name)')
      .eq('user_id', dashSession.user.id)
      .single()
    
    if (dashError) {
      console.error('❌ Dashboard employee fetch error:', dashError.message)
      console.error('   Dashboard will redirect to login')
      return
    }

    console.log('✅ Dashboard data loaded')
    console.log('   Name:', dashEmployee.full_name)
    console.log('   Role:', dashEmployee.role)
    console.log('   Unit:', dashEmployee.m_units?.name)

    // Step 6: Test authenticated layout
    console.log('\n6️⃣ AUTHENTICATED LAYOUT SIMULATION')
    console.log('-'.repeat(60))
    
    const { data: { session: layoutSession } } = await supabase.auth.getSession()
    
    if (!layoutSession) {
      console.error('❌ Session lost in layout!')
      return
    }

    console.log('✅ Layout session valid')

    // Step 7: Sign out
    console.log('\n7️⃣ SIGN OUT')
    console.log('-'.repeat(60))
    
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out error:', signOutError.message)
    } else {
      console.log('✅ Signed out successfully')
    }

    const { data: { session: afterSignOut } } = await supabase.auth.getSession()
    console.log('Session after sign out:', afterSignOut ? '❌ Still exists' : '✅ Cleared')

    console.log('\n' + '='.repeat(60))
    console.log('✅ COMPLETE LOGIN FLOW TEST PASSED')
    console.log('='.repeat(60))
    console.log('\nAll steps completed successfully!')
    console.log('The login system is working correctly in the backend.')
    console.log('\nIf login still fails in browser, the issue is likely:')
    console.log('1. Browser cookies/storage being blocked')
    console.log('2. CORS or domain mismatch')
    console.log('3. Client-side JavaScript errors')
    console.log('4. Auth state handler interference')

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('Stack:', error.stack)
  }
}

testCompleteBrowserLogin()
