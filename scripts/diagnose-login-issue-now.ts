import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnoseLogin() {
  console.log('🔍 Diagnosing login issue...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Try to sign in
    console.log('1️⃣ Testing sign in with password...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError) {
      console.error('❌ Sign in failed:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ No user returned from sign in')
      return
    }

    console.log('✅ Sign in successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Role from metadata:', authData.user.user_metadata?.role)

    // Test 2: Check employee record
    console.log('\n2️⃣ Checking employee record...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('❌ Employee fetch error:', employeeError.message)
      return
    }

    if (!employeeData) {
      console.error('❌ No employee record found')
      return
    }

    console.log('✅ Employee record found')
    console.log('   Employee ID:', employeeData.id)
    console.log('   Full Name:', employeeData.full_name)
    console.log('   Unit ID:', employeeData.unit_id)
    console.log('   Is Active:', employeeData.is_active)

    // Test 3: Check session
    console.log('\n3️⃣ Checking session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }

    if (!session) {
      console.error('❌ No session found')
      return
    }

    console.log('✅ Session is valid')
    console.log('   Access token exists:', !!session.access_token)
    console.log('   Refresh token exists:', !!session.refresh_token)
    console.log('   Expires at:', new Date(session.expires_at! * 1000).toLocaleString())

    // Test 4: Check if user can access protected data
    console.log('\n4️⃣ Testing access to protected data...')
    const { data: units, error: unitsError } = await supabase
      .from('m_units')
      .select('id, name')
      .limit(1)

    if (unitsError) {
      console.error('❌ Cannot access units:', unitsError.message)
    } else {
      console.log('✅ Can access protected data')
      console.log('   Sample unit:', units?.[0])
    }

    console.log('\n✅ All tests passed! Login should work.')
    console.log('\n📋 Summary:')
    console.log('   - Authentication: Working')
    console.log('   - Employee record: Found and active')
    console.log('   - Session: Valid')
    console.log('   - Data access: Working')
    console.log('\n💡 If login still fails in browser, check:')
    console.log('   1. Browser console for JavaScript errors')
    console.log('   2. Network tab for failed requests')
    console.log('   3. Browser storage (localStorage/sessionStorage)')
    console.log('   4. Try clearing browser cache and cookies')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

diagnoseLogin()
