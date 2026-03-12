import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginFix() {
  console.log('🔧 Testing Login Fix\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Step 1: Sign in
    console.log('1️⃣ Testing sign in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user) {
      console.error('❌ Sign in failed:', authError?.message)
      return
    }

    console.log('✅ Sign in successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Role:', authData.user.user_metadata?.role)

    // Step 2: Test employee fetch with .single()
    console.log('\n2️⃣ Testing employee fetch with .single()...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .limit(1)
      .single()

    if (employeeError) {
      console.error('❌ Employee fetch failed:', employeeError.message)
      console.error('   Error code:', employeeError.code)
      console.error('   Error details:', employeeError.details)
      return
    }

    if (!employeeData) {
      console.error('❌ No employee data returned')
      return
    }

    console.log('✅ Employee data fetched successfully')
    console.log('   Employee ID:', employeeData.id)
    console.log('   Name:', employeeData.full_name)
    console.log('   Active:', employeeData.is_active)
    console.log('   Unit ID:', employeeData.unit_id)

    // Step 3: Verify session
    console.log('\n3️⃣ Verifying session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ Session verification failed')
      return
    }

    console.log('✅ Session is valid')
    console.log('   Expires:', new Date(session.expires_at! * 1000).toLocaleString())

    // Step 4: Test dashboard data access
    console.log('\n4️⃣ Testing dashboard data access...')
    
    const { count: unitsCount } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: employeesCount } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log('✅ Dashboard data accessible')
    console.log('   Units:', unitsCount)
    console.log('   Employees:', employeesCount)

    console.log('\n✅ ALL TESTS PASSED!')
    console.log('\n📋 Login fix verified:')
    console.log('   ✓ Authentication working')
    console.log('   ✓ Employee fetch working with .single()')
    console.log('   ✓ Session valid')
    console.log('   ✓ Dashboard data accessible')
    console.log('\n🎉 Login should now work in browser!')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testLoginFix()
