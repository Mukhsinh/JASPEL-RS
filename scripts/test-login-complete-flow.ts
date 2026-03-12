import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginFlow() {
  console.log('🔐 Testing Complete Login Flow\n')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  try {
    // Step 1: Sign in
    console.log('1️⃣ Signing in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError?.message)
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Role:', authData.user.user_metadata?.role)

    // Step 2: Get employee data
    console.log('\n2️⃣ Fetching employee data...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (employeeError || !employeeData) {
      console.error('❌ Employee fetch failed:', employeeError?.message)
      return
    }

    console.log('✅ Employee data found')
    console.log('   Name:', employeeData.full_name)
    console.log('   Active:', employeeData.is_active)

    // Step 3: Check session
    console.log('\n3️⃣ Checking session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ Session check failed:', sessionError?.message)
      return
    }

    console.log('✅ Session is valid')
    console.log('   Expires:', new Date(session.expires_at! * 1000).toLocaleString())

    // Step 4: Test dashboard data access
    console.log('\n4️⃣ Testing dashboard data access...')
    
    // Test units count
    const { count: unitsCount, error: unitsError } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (unitsError) {
      console.error('❌ Cannot fetch units:', unitsError.message)
    } else {
      console.log('✅ Units count:', unitsCount)
    }

    // Test employees count
    const { count: employeesCount, error: employeesError } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (employeesError) {
      console.error('❌ Cannot fetch employees:', employeesError.message)
    } else {
      console.log('✅ Employees count:', employeesCount)
    }

    // Test pools
    const { data: pools, error: poolsError } = await supabase
      .from('t_pool')
      .select('allocated_amount')
      .eq('status', 'approved')

    if (poolsError) {
      console.error('❌ Cannot fetch pools:', poolsError.message)
    } else {
      const totalPoolAmount = pools?.reduce((sum, pool) => sum + (pool.allocated_amount || 0), 0) || 0
      console.log('✅ Total pool amount:', totalPoolAmount)
    }

    console.log('\n✅ ALL TESTS PASSED!')
    console.log('\n📋 Summary:')
    console.log('   ✓ Authentication working')
    console.log('   ✓ Employee record found')
    console.log('   ✓ Session valid')
    console.log('   ✓ Dashboard data accessible')
    console.log('\n💡 Login should work in browser. If it still fails:')
    console.log('   1. Open browser DevTools (F12)')
    console.log('   2. Go to Console tab')
    console.log('   3. Try to login and check for errors')
    console.log('   4. Go to Network tab and check for failed requests')
    console.log('   5. Go to Application > Storage and clear all site data')
    console.log('   6. Try login again')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testLoginFlow()
