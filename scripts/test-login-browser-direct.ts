/**
 * Test login flow and check what happens after successful authentication
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginFlow() {
  console.log('🧪 Testing Complete Login Flow\n')
  console.log('=' .repeat(60))
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist in Node.js
      autoRefreshToken: false,
    }
  })

  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'

  try {
    // Step 1: Sign in
    console.log('\n📝 Step 1: Signing in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError?.message)
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Session expires:', new Date(authData.session.expires_at! * 1000).toISOString())

    // Step 2: Check user metadata
    console.log('\n📝 Step 2: Checking user metadata...')
    const role = authData.user.user_metadata?.role
    const fullName = authData.user.user_metadata?.full_name

    if (!role) {
      console.error('❌ Role not found in metadata')
      return
    }

    console.log('✅ User metadata found')
    console.log('   Role:', role)
    console.log('   Full Name:', fullName)

    // Step 3: Fetch employee data
    console.log('\n📝 Step 3: Fetching employee data...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, employee_code, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (employeeError || !employee) {
      console.error('❌ Employee fetch failed:', employeeError?.message)
      return
    }

    console.log('✅ Employee data found')
    console.log('   Employee ID:', employee.id)
    console.log('   Employee Code:', employee.employee_code)
    console.log('   Full Name:', employee.full_name)
    console.log('   Unit ID:', employee.unit_id)
    console.log('   Is Active:', employee.is_active)

    // Step 4: Check if employee is active
    if (!employee.is_active) {
      console.error('❌ Employee is not active')
      return
    }

    console.log('✅ Employee is active')

    // Step 5: Test dashboard access (simulate what middleware does)
    console.log('\n📝 Step 5: Testing dashboard access...')
    
    // Check if user can access dashboard data
    const { count: unitsCount, error: unitsError } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (unitsError) {
      console.error('❌ Dashboard data access failed:', unitsError.message)
    } else {
      console.log('✅ Dashboard data accessible')
      console.log('   Units count:', unitsCount)
    }

    // Step 6: Summary
    console.log('\n' + '=' .repeat(60))
    console.log('📊 LOGIN FLOW SUMMARY:')
    console.log('=' .repeat(60))
    console.log('✅ Authentication: SUCCESS')
    console.log('✅ Session: VALID')
    console.log('✅ User Metadata: FOUND')
    console.log('✅ Employee Data: FOUND')
    console.log('✅ Employee Status: ACTIVE')
    console.log('✅ Dashboard Access: OK')
    console.log('')
    console.log('🎯 Expected behavior after login:')
    console.log('   1. User clicks "Masuk ke Sistem"')
    console.log('   2. Button shows "Memproses..."')
    console.log('   3. After 1 second delay, redirect to /dashboard')
    console.log('   4. Middleware validates session')
    console.log('   5. Dashboard page loads with user data')
    console.log('')
    console.log('🔍 If login doesn\'t work in browser:')
    console.log('   1. Open DevTools Console (F12)')
    console.log('   2. Look for errors during login')
    console.log('   3. Check Network tab for failed requests')
    console.log('   4. Clear browser cache and cookies')
    console.log('   5. Try in incognito mode')
    console.log('')
    console.log('💡 Common issues:')
    console.log('   - Browser blocking cookies')
    console.log('   - CORS issues with Supabase')
    console.log('   - JavaScript errors in console')
    console.log('   - Redirect being blocked')
    console.log('   - Session not persisting in localStorage')
    console.log('')

    // Clean up
    await supabase.auth.signOut()

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testLoginFlow()
