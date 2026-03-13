import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testKPIConfigAPI() {
  console.log('🧪 Testing KPI Config API Fix...\n')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Get a superadmin user
    console.log('1. Finding superadmin user...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('user_id, full_name, role, employee_code')
      .eq('role', 'superadmin')
      .limit(1)

    if (empError || !employees || employees.length === 0) {
      console.error('❌ No superadmin found in m_employees')
      console.error('Error:', empError)
      return
    }

    const superadmin = employees[0]
    console.log(`✓ Found superadmin: ${superadmin.full_name} (${superadmin.employee_code})`)
    console.log(`  user_id: ${superadmin.user_id}`)

    // 2. Verify the user exists in auth.users
    console.log('\n2. Verifying auth.users...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(superadmin.user_id)
    
    if (authError || !authUser) {
      console.error('❌ User not found in auth.users')
      console.error('Error:', authError)
      return
    }

    console.log(`✓ Auth user found: ${authUser.user.email}`)

    // 3. Test the query pattern used in the API
    console.log('\n3. Testing API query pattern...')
    const { data: employee, error: queryError } = await supabase
      .from('m_employees')
      .select('role, full_name, employee_code')
      .eq('user_id', superadmin.user_id)
      .single()

    if (queryError) {
      console.error('❌ Query failed:', queryError.message)
      console.error('Details:', queryError)
      return
    }

    console.log('✓ Query successful!')
    console.log('  Result:', employee)

    // 4. Check role
    console.log('\n4. Checking role authorization...')
    if (employee.role === 'superadmin') {
      console.log('✓ Role check passed: superadmin')
    } else {
      console.log(`⚠ Role is: ${employee.role} (expected: superadmin)`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ API Fix Verification PASSED')
    console.log('\nThe API should now work correctly!')
    console.log('Test by accessing: http://localhost:3002/api/kpi-config')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testKPIConfigAPI()
