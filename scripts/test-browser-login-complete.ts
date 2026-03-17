import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testBrowserLogin() {
  console.log('🧪 Testing browser login flow...\n')
  
  // Simulate browser client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: undefined // Use default storage
    }
  })

  const testEmail = 'mukhsin9@gmail.com'
  const testPassword = 'admin123'

  try {
    // 1. Clear any existing session
    console.log('1️⃣ Clearing existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    console.log('✅ Session cleared\n')

    // 2. Attempt login
    console.log('2️⃣ Attempting login...')
    console.log('   Email:', testEmail)
    console.log('   Password: ********\n')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      console.error('   Code:', authError.status)
      console.error('   Details:', authError)
      return
    }

    if (!authData.user || !authData.session) {
      console.error('❌ No user or session returned')
      return
    }

    console.log('✅ Login successful!\n')
    console.log('👤 User Info:')
    console.log('   - ID:', authData.user.id)
    console.log('   - Email:', authData.user.email)
    console.log('   - Email Confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No')
    console.log('   - Role:', authData.user.user_metadata?.role || 'NOT SET')
    console.log('   - Created:', authData.user.created_at)

    console.log('\n🔐 Session Info:')
    console.log('   - Access Token:', authData.session.access_token.substring(0, 20) + '...')
    console.log('   - Refresh Token:', authData.session.refresh_token.substring(0, 20) + '...')
    console.log('   - Expires At:', new Date(authData.session.expires_at! * 1000).toLocaleString())
    console.log('   - Token Type:', authData.session.token_type)

    // 3. Verify session
    console.log('\n3️⃣ Verifying session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Session verification failed:', sessionError.message)
      return
    }

    if (!session) {
      console.error('❌ No session found after login')
      return
    }

    console.log('✅ Session verified\n')

    // 4. Fetch employee data
    console.log('4️⃣ Fetching employee data...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, employee_code, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()

    if (employeeError) {
      console.error('❌ Employee fetch failed:', employeeError.message)
      console.error('   Code:', employeeError.code)
      console.error('   Details:', employeeError.details)
      return
    }

    if (!employee) {
      console.error('❌ No employee record found')
      return
    }

    console.log('✅ Employee data fetched\n')
    console.log('👨‍💼 Employee Info:')
    console.log('   - ID:', employee.id)
    console.log('   - Code:', employee.employee_code)
    console.log('   - Name:', employee.full_name)
    console.log('   - Unit ID:', employee.unit_id || 'null (superadmin)')
    console.log('   - Active:', employee.is_active)

    // 5. Test sign out
    console.log('\n5️⃣ Testing sign out...')
    await supabase.auth.signOut()
    
    const { data: { session: afterSignOut } } = await supabase.auth.getSession()
    
    if (afterSignOut) {
      console.error('❌ Session still exists after sign out')
    } else {
      console.log('✅ Sign out successful')
    }

    console.log('\n✅ All tests passed!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Login works')
    console.log('   ✅ Session created')
    console.log('   ✅ Employee data accessible')
    console.log('   ✅ Sign out works')
    console.log('\n🎉 Browser login flow is working correctly!')

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error(error)
  }
}

testBrowserLogin()
