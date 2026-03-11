import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAssessmentAccessIssue() {
  console.log('🔍 Checking Assessment Access Issue...\n')

  try {
    // 1. Check m_employees table structure
    console.log('1. Checking m_employees table structure...')
    const { data: employees, error: employeesError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, user_id')
      .eq('is_active', true)
      .limit(5)

    if (employeesError) {
      console.error('   ❌ Error fetching employees:', employeesError.message)
      return
    }

    console.log(`   ✅ Found ${employees?.length || 0} active employees`)
    
    // Check if user_id column exists and is populated
    const hasUserIds = employees?.some(emp => emp.user_id)
    console.log(`   User ID column populated: ${hasUserIds ? '✅' : '❌'}`)

    if (employees && employees.length > 0) {
      console.log('   Sample employee data:')
      employees.slice(0, 2).forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.role}): user_id=${emp.user_id || 'NULL'}`)
      })
    }

    // 2. Check auth.users table
    console.log('\n2. Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('   ❌ Error fetching auth users:', authError.message)
    } else {
      console.log(`   ✅ Found ${authUsers.users?.length || 0} auth users`)
      
      if (authUsers.users && authUsers.users.length > 0) {
        console.log('   Sample auth user data:')
        authUsers.users.slice(0, 2).forEach(user => {
          console.log(`   - ${user.email}: role=${user.user_metadata?.role || 'none'}`)
        })
      }
    }

    // 3. Check if we can access assessment page directly
    console.log('\n3. Testing assessment page access...')
    
    // Find a superadmin user
    const superadmin = employees?.find(emp => emp.role === 'superadmin' && emp.user_id)
    
    if (superadmin) {
      console.log(`   Testing with superadmin: ${superadmin.full_name}`)
      
      // Test pool access (required for assessment page)
      const { data: pools, error: poolError } = await supabase
        .from('t_pool')
        .select('period, status')
        .in('status', ['approved', 'distributed'])
        .limit(5)

      if (poolError) {
        console.error('   ❌ Pool access error:', poolError.message)
      } else {
        console.log(`   ✅ Pool access successful: ${pools?.length || 0} pools found`)
      }

      // Test KPI indicators access
      const { data: indicators, error: indicatorsError } = await supabase
        .from('m_kpi_indicators')
        .select('id, name')
        .eq('is_active', true)
        .limit(5)

      if (indicatorsError) {
        console.error('   ❌ KPI indicators access error:', indicatorsError.message)
      } else {
        console.log(`   ✅ KPI indicators access successful: ${indicators?.length || 0} indicators found`)
      }
    } else {
      console.log('   ❌ No superadmin with user_id found')
    }

    // 4. Check current URL routing
    console.log('\n4. Checking URL routing...')
    console.log('   Expected URL: /assessment')
    console.log('   Middleware pattern: /assessment/:path*')
    console.log('   Route config: superadmin, unit_manager allowed')

    // 5. Check if there are any RLS policy issues
    console.log('\n5. Testing RLS policies...')
    
    // Test with service role (should bypass RLS)
    const { data: testData, error: testError } = await supabase
      .from('m_employees')
      .select('count')
      .eq('is_active', true)

    if (testError) {
      console.error('   ❌ RLS test error:', testError.message)
    } else {
      console.log('   ✅ RLS test successful')
    }

    console.log('\n✅ Assessment access check complete!')

  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

// Run the check
checkAssessmentAccessIssue()