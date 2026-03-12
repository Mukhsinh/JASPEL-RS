import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnoseLogin() {
  console.log('🔍 Diagnosing Login Issue...\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Test credentials
  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'

  console.log('📧 Testing login with:', email)
  console.log('🔑 Password length:', password.length)
  console.log('')

  try {
    // Step 1: Test authentication
    console.log('Step 1: Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })

    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
      console.error('Error details:', authError)
      return
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return
    }

    console.log('✅ Authentication successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   User metadata:', JSON.stringify(authData.user.user_metadata, null, 2))
    console.log('')

    // Step 2: Check session
    console.log('Step 2: Checking session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }

    if (!sessionData.session) {
      console.error('❌ No session found')
      return
    }

    console.log('✅ Session valid')
    console.log('   Access token length:', sessionData.session.access_token.length)
    console.log('   Expires at:', new Date(sessionData.session.expires_at! * 1000).toISOString())
    console.log('')

    // Step 3: Fetch employee data
    console.log('Step 3: Fetching employee data...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, employee_code, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('❌ Employee fetch error:', employeeError.message)
      console.error('Error details:', employeeError)
      return
    }

    if (!employeeData) {
      console.error('❌ No employee data found')
      return
    }

    console.log('✅ Employee data found')
    console.log('   Employee ID:', employeeData.id)
    console.log('   Employee Code:', employeeData.employee_code)
    console.log('   Full Name:', employeeData.full_name)
    console.log('   Unit ID:', employeeData.unit_id)
    console.log('   Is Active:', employeeData.is_active)
    console.log('')

    // Step 4: Check role from metadata
    console.log('Step 4: Checking role...')
    const role = authData.user.user_metadata?.role

    if (!role) {
      console.error('❌ Role not found in user metadata')
      return
    }

    console.log('✅ Role found:', role)
    console.log('')

    // Step 5: Test RLS policies
    console.log('Step 5: Testing RLS policies...')
    
    // Test units access
    const { data: unitsData, error: unitsError } = await supabase
      .from('m_units')
      .select('id, unit_name')
      .limit(1)

    if (unitsError) {
      console.error('❌ Units access error:', unitsError.message)
    } else {
      console.log('✅ Units access OK (found', unitsData?.length || 0, 'records)')
    }

    // Test employees access
    const { data: employeesData, error: employeesError } = await supabase
      .from('m_employees')
      .select('id, full_name')
      .limit(1)

    if (employeesError) {
      console.error('❌ Employees access error:', employeesError.message)
    } else {
      console.log('✅ Employees access OK (found', employeesData?.length || 0, 'records)')
    }

    console.log('')

    // Step 6: Summary
    console.log('📊 Summary:')
    console.log('   ✅ Authentication: SUCCESS')
    console.log('   ✅ Session: VALID')
    console.log('   ✅ Employee Data: FOUND')
    console.log('   ✅ Role: ' + role)
    console.log('   ✅ Active Status:', employeeData.is_active)
    console.log('')
    console.log('🎉 Login should work! If it doesn\'t work in browser:')
    console.log('   1. Clear browser cache and cookies')
    console.log('   2. Try incognito/private mode')
    console.log('   3. Check browser console for errors')
    console.log('   4. Check Network tab for failed requests')

    // Clean up
    await supabase.auth.signOut()

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

diagnoseLogin()
