/**
 * Automated browser login test
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginFlow() {
  console.log('🔍 Testing complete login flow...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Step 1: Clear any existing session
  console.log('1️⃣ Clearing existing session...')
  await supabase.auth.signOut({ scope: 'local' })
  await new Promise(resolve => setTimeout(resolve, 100))
  console.log('✅ Session cleared\n')

  // Step 2: Perform login
  console.log('2️⃣ Performing login...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mukhsin9@gmail.com',
    password: 'admin123',
  })

  if (authError || !authData.user || !authData.session) {
    console.error('❌ Login failed:', authError?.message)
    return false
  }
  console.log('✅ Login successful')
  console.log('   User ID:', authData.user.id)
  console.log('   Email:', authData.user.email)
  console.log('   Role:', authData.user.user_metadata?.role)
  console.log('')

  // Step 3: Verify session
  console.log('3️⃣ Verifying session...')
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session) {
    console.error('❌ Session verification failed:', sessionError?.message)
    return false
  }
  console.log('✅ Session verified')
  console.log('   Access token length:', session.access_token.length)
  console.log('   Expires at:', new Date(session.expires_at! * 1000).toLocaleString())
  console.log('')

  // Step 4: Check middleware requirements
  console.log('4️⃣ Checking middleware requirements...')
  
  // Check role
  const role = authData.user.user_metadata?.role
  if (!role) {
    console.error('❌ Role missing in user_metadata')
    return false
  }
  console.log('✅ Role found:', role)

  // Check employee record
  const { data: employee, error: empError } = await supabase
    .from('m_employees')
    .select('is_active, full_name, unit_id, m_units(name)')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (empError || !employee) {
    console.error('❌ Employee record not found:', empError?.message)
    return false
  }

  if (!employee.is_active) {
    console.error('❌ Employee is inactive')
    return false
  }

  console.log('✅ Employee record found')
  console.log('   Name:', employee.full_name)
  console.log('   Active:', employee.is_active)
  console.log('   Unit:', employee.m_units?.name)
  console.log('')

  // Step 5: Test dashboard access simulation
  console.log('5️⃣ Simulating dashboard access...')
  
  // This simulates what happens when user accesses /dashboard
  const { data: dashboardEmployee, error: dashError } = await supabase
    .from('m_employees')
    .select('id, full_name, role, unit_id, m_units(name)')
    .eq('user_id', authData.user.id)
    .single()

  if (dashError || !dashboardEmployee) {
    console.error('❌ Dashboard access would fail:', dashError?.message)
    return false
  }

  console.log('✅ Dashboard access would succeed')
  console.log('   User would see:', dashboardEmployee.full_name)
  console.log('   Role:', dashboardEmployee.role)
  console.log('   Unit:', dashboardEmployee.m_units?.name)
  console.log('')

  // Clean up
  await supabase.auth.signOut()

  console.log('✅ ALL TESTS PASSED!')
  console.log('')
  console.log('📝 Login flow is working correctly')
  console.log('   You can now test in browser at: http://localhost:3002/login')
  console.log('')

  return true
}

testLoginFlow().then(success => {
  if (!success) {
    console.error('\n❌ Login flow test failed!')
    process.exit(1)
  }
})
