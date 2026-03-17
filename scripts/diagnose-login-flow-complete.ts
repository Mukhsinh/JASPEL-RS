import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseLoginFlow() {
  console.log('🔍 Diagnosing Complete Login Flow...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const testEmail = 'mukhsin9@gmail.com'
  const testPassword = 'admin123'

  try {
    // 1. Check user exists in auth.users
    console.log('1️⃣ Checking auth.users...')
    const { data: authUsers, error: authError } = await supabase.rpc('get_user_by_email', {
      user_email: testEmail
    })

    if (authError || !authUsers || authUsers.length === 0) {
      console.error('❌ Error fetching auth user:', authError)
      
      // Try direct SQL query
      const { data: sqlResult } = await supabase.rpc('exec_sql', {
        query: `SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = '${testEmail}'`
      })
      
      if (sqlResult && sqlResult.length > 0) {
        console.log('✅ Auth user found (via SQL):')
        console.log('   - ID:', sqlResult[0].id)
        console.log('   - Email:', sqlResult[0].email)
        console.log('   - Metadata:', sqlResult[0].raw_user_meta_data)
      }
      return
    }

    const authUser = Array.isArray(authUsers) ? authUsers[0] : authUsers

    console.log('✅ Auth user found:')
    console.log('   - ID:', authUser.id)
    console.log('   - Email:', authUser.email)
    console.log('   - Role:', authUser.raw_user_meta_data?.role)
    console.log()

    // 2. Check employee record
    console.log('2️⃣ Checking m_employees...')
    const userId = authUser.id
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (empError) {
      console.error('❌ Error fetching employee:', empError)
      return
    }

    console.log('✅ Employee found:')
    console.log('   - ID:', employee.id)
    console.log('   - Name:', employee.full_name)
    console.log('   - Active:', employee.is_active)
    console.log('   - Unit ID:', employee.unit_id)
    console.log()

    // 3. Test actual login with anon key (simulating browser)
    console.log('3️⃣ Testing login with anon key (browser simulation)...')
    const anonSupabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      }
    )

    const { data: loginData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      console.error('❌ Login failed:', loginError)
      return
    }

    console.log('✅ Login successful!')
    console.log('   - User ID:', loginData.user?.id)
    console.log('   - Email:', loginData.user?.email)
    console.log('   - Session expires:', new Date(loginData.session?.expires_at! * 1000).toLocaleString())
    console.log('   - Access token length:', loginData.session?.access_token?.length)
    console.log('   - Refresh token length:', loginData.session?.refresh_token?.length)
    console.log()

    // 4. Test fetching employee with session
    console.log('4️⃣ Testing employee fetch with session...')
    const { data: empWithSession, error: empSessionError } = await anonSupabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', loginData.user?.id)
      .single()

    if (empSessionError) {
      console.error('❌ Error fetching employee with session:', empSessionError)
      
      // Check RLS policies
      console.log('\n5️⃣ Checking RLS policies...')
      const { data: policies } = await supabase.rpc('pg_policies', {})
      console.log('RLS Policies:', policies)
      
      return
    }

    console.log('✅ Employee fetched with session:')
    console.log('   - ID:', empWithSession.id)
    console.log('   - Name:', empWithSession.full_name)
    console.log('   - Active:', empWithSession.is_active)
    console.log()

    // 5. Check route permissions
    console.log('5️⃣ Checking route permissions...')
    const role = loginData.user?.user_metadata?.role
    console.log('   - User role:', role)
    
    if (role === 'superadmin') {
      console.log('   ✅ Should have access to /dashboard')
      console.log('   ✅ Should have access to /units')
      console.log('   ✅ Should have access to /users')
      console.log('   ✅ Should have access to /kpi-config')
      console.log('   ✅ Should have access to /pool')
    }
    console.log()

    // 6. Sign out
    console.log('6️⃣ Testing sign out...')
    const { error: signOutError } = await anonSupabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError)
    } else {
      console.log('✅ Sign out successful')
    }
    console.log()

    console.log('✅ All checks passed! Login flow should work.')
    console.log('\n📋 Summary:')
    console.log('   - Auth user: ✅')
    console.log('   - Employee record: ✅')
    console.log('   - Login: ✅')
    console.log('   - Session: ✅')
    console.log('   - Employee fetch with session: ✅')
    console.log('   - Sign out: ✅')
    console.log('\n💡 If login still fails in browser:')
    console.log('   1. Clear browser cookies and localStorage')
    console.log('   2. Check browser console for errors')
    console.log('   3. Check Network tab for failed requests')
    console.log('   4. Verify middleware is not blocking')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

diagnoseLoginFlow()
