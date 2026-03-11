import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAssessmentAccess() {
  console.log('🔍 Debugging Assessment Page Access...\n')

  try {
    // 1. Check if assessment route exists in middleware config
    console.log('1. Checking middleware configuration...')
    const middlewareConfig = [
      '/dashboard/:path*',
      '/units/:path*',
      '/users/:path*',
      '/pegawai/:path*',
      '/kpi-config/:path*',
      '/pool/:path*',
      '/realization/:path*',
      '/assessment/:path*',
      '/reports/:path*',
      '/audit/:path*',
      '/settings/:path*',
      '/profile/:path*',
      '/notifications/:path*'
    ]
    
    const hasAssessmentRoute = middlewareConfig.includes('/assessment/:path*')
    console.log(`   Assessment route in middleware: ${hasAssessmentRoute ? '✅' : '❌'}`)

    // 2. Check route permissions
    console.log('\n2. Checking route permissions...')
    const routeConfigs = [
      {
        path: '/assessment',
        allowedRoles: ['superadmin', 'unit_manager'],
        description: 'KPI assessment and evaluation'
      }
    ]
    
    const assessmentConfig = routeConfigs.find(rc => rc.path === '/assessment')
    console.log(`   Assessment route config: ${assessmentConfig ? '✅' : '❌'}`)
    if (assessmentConfig) {
      console.log(`   Allowed roles: ${assessmentConfig.allowedRoles.join(', ')}`)
    }

    // 3. Check current users and their roles
    console.log('\n3. Checking current users...')
    const { data: employees, error: employeesError } = await supabase
      .from('m_employees')
      .select(`
        id,
        full_name,
        role,
        is_active,
        user_id,
        auth_users!inner(email)
      `)
      .eq('is_active', true)
      .order('role')

    if (employeesError) {
      console.error('   Error fetching employees:', employeesError)
      return
    }

    console.log(`   Found ${employees?.length || 0} active employees:`)
    employees?.forEach(emp => {
      const canAccessAssessment = ['superadmin', 'unit_manager'].includes(emp.role)
      console.log(`   - ${emp.full_name} (${emp.role}): ${canAccessAssessment ? '✅ Can access' : '❌ Cannot access'}`)
    })

    // 4. Check if assessment page file exists
    console.log('\n4. Checking assessment page file...')
    try {
      const fs = require('fs')
      const assessmentPageExists = fs.existsSync('app/(authenticated)/assessment/page.tsx')
      console.log(`   Assessment page file exists: ${assessmentPageExists ? '✅' : '❌'}`)
      
      if (assessmentPageExists) {
        const assessmentComponentExists = fs.existsSync('components/assessment/AssessmentPageContent.tsx')
        console.log(`   Assessment component exists: ${assessmentComponentExists ? '✅' : '❌'}`)
      }
    } catch (error) {
      console.log('   Could not check file system')
    }

    // 5. Test database access for assessment
    console.log('\n5. Testing database access for assessment...')
    
    // Check if required tables exist
    const tables = ['t_pool', 'm_employees', 'm_kpi_indicators']
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        console.log(`   Table ${table}: ${error ? '❌ Error' : '✅ Accessible'}`)
        if (error) {
          console.log(`     Error: ${error.message}`)
        }
      } catch (error) {
        console.log(`   Table ${table}: ❌ Exception`)
      }
    }

    // 6. Check for any RLS issues
    console.log('\n6. Testing RLS policies...')
    
    // Test as superadmin
    const { data: superadmin } = await supabase
      .from('m_employees')
      .select('user_id')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (superadmin) {
      console.log('   Testing with superadmin user...')
      
      // Create client with user context (simulate auth)
      const { data: pools, error: poolsError } = await supabase
        .from('t_pool')
        .select('period')
        .in('status', ['approved', 'distributed'])
        .limit(5)

      console.log(`   Pool access: ${poolsError ? '❌ Error' : '✅ Success'}`)
      if (poolsError) {
        console.log(`     Error: ${poolsError.message}`)
      } else {
        console.log(`     Found ${pools?.length || 0} pools`)
      }
    }

    console.log('\n✅ Assessment access debug complete!')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugAssessmentAccess()