import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginFlow() {
  console.log('🔍 Testing Simple Login Flow...\n')
  
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
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
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      console.error('   Error code:', loginError.status)
      console.error('   Error details:', loginError)
      return
    }

    if (!loginData.user || !loginData.session) {
      console.error('❌ No user or session returned')
      return
    }

    console.log('✅ Login successful!')
    console.log('   - User ID:', loginData.user.id)
    console.log('   - Email:', loginData.user.email)
    console.log('   - Role:', loginData.user.user_metadata?.role)
    console.log('   - Session expires:', new Date(loginData.session.expires_at! * 1000).toLocaleString())
    console.log()

    // 3. Fetch employee data
    console.log('3️⃣ Fetching employee data...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', loginData.user.id)
      .single()

    if (empError) {
      console.error('❌ Error fetching employee:', empError.message)
      console.error('   Error code:', empError.code)
      console.error('   Error details:', empError)
      
      // Try to get session to debug
      const { data: { session } } = await supabase.auth.getSession()
      console.log('\n   Current session:', session ? 'EXISTS' : 'NONE')
      if (session) {
        console.log('   Session user:', session.user.id)
        console.log('   Session role:', session.user.user_metadata?.role)
      }
      return
    }

    if (!employee) {
      console.error('❌ Employee not found')
      return
    }

    console.log('✅ Employee data fetched:')
    console.log('   - ID:', employee.id)
    console.log('   - Name:', employee.full_name)
    console.log('   - Active:', employee.is_active)
    console.log('   - Unit ID:', employee.unit_id)
    console.log()

    // 4. Check if active
    if (!employee.is_active) {
      console.error('❌ Employee is not active')
      return
    }

    console.log('✅ Employee is active')
    console.log()

    // 5. Verify session is still valid
    console.log('4️⃣ Verifying session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ Session verification failed:', sessionError)
      return
    }

    console.log('✅ Session is valid')
    console.log('   - User ID:', session.user.id)
    console.log('   - Expires in:', Math.floor((session.expires_at! * 1000 - Date.now()) / 1000), 'seconds')
    console.log()

    // 6. Sign out
    console.log('5️⃣ Signing out...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError)
    } else {
      console.log('✅ Sign out successful')
    }
    console.log()

    console.log('✅✅✅ ALL CHECKS PASSED! ✅✅✅')
    console.log('\n📋 Login Flow Summary:')
    console.log('   1. Clear session: ✅')
    console.log('   2. Login: ✅')
    console.log('   3. Fetch employee: ✅')
    console.log('   4. Verify session: ✅')
    console.log('   5. Sign out: ✅')
    console.log('\n💡 If browser login still fails:')
    console.log('   1. Open browser DevTools (F12)')
    console.log('   2. Go to Application tab')
    console.log('   3. Clear all cookies and localStorage')
    console.log('   4. Try login again')
    console.log('   5. Check Console tab for errors')
    console.log('   6. Check Network tab for failed requests')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

testLoginFlow()
