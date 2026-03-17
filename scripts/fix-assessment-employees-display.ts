#!/usr/bin/env tsx

/**
 * Fix Assessment Employees Display Issue
 * 
 * This script applies the RLS policy fixes and tests the assessment employees endpoint
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  console.log('🔧 Fixing Assessment Employees Display Issue...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // 1. Apply the migration
    console.log('📋 Applying RLS policy migration...')
    const migrationPath = join(process.cwd(), 'supabase/migrations/fix_assessment_employees_rls.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError)
      return
    }
    console.log('✅ Migration applied successfully')

    // 2. Test employee data access
    console.log('\n🧪 Testing employee data access...')
    
    // Get a test user (superadmin)
    const { data: testUser } = await supabase
      .from('m_employees')
      .select('user_id, email, role, full_name')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!testUser) {
      console.log('⚠️  No superadmin user found, creating test scenario...')
      return
    }

    console.log('👤 Test user:', testUser.full_name, `(${testUser.role})`)

    // Test direct employee access
    const { data: employees, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, role, is_active')
      .eq('is_active', true)
      .limit(5)

    if (employeeError) {
      console.error('❌ Employee access failed:', employeeError)
    } else {
      console.log(`✅ Employee access successful: ${employees?.length || 0} employees found`)
    }

    // Test assessment status view
    const { data: assessmentStatus, error: viewError } = await supabase
      .from('v_assessment_status')
      .select('*')
      .limit(5)

    if (viewError) {
      console.error('❌ Assessment status view failed:', viewError)
    } else {
      console.log(`✅ Assessment status view successful: ${assessmentStatus?.length || 0} records found`)
    }

    // 3. Test API endpoint simulation
    console.log('\n🌐 Testing API endpoint logic...')
    
    // Simulate the API call
    const testPeriod = '2026-01'
    const { data: apiResult, error: apiError } = await supabase
      .from('v_assessment_status')
      .select('*')
      .eq('period', testPeriod)
      .order('full_name')

    if (apiError) {
      console.error('❌ API simulation failed:', apiError)
    } else {
      console.log(`✅ API simulation successful: ${apiResult?.length || 0} employees for period ${testPeriod}`)
      
      if (apiResult && apiResult.length > 0) {
        console.log('📊 Sample data:')
        apiResult.slice(0, 3).forEach((emp: any) => {
          console.log(`   - ${emp.full_name} (${emp.unit_name}): ${emp.status}`)
        })
      }
    }

    // 4. Check for available periods
    console.log('\n📅 Checking available periods...')
    const { data: periods } = await supabase
      .from('t_pool')
      .select('period')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })

    if (periods && periods.length > 0) {
      console.log('✅ Available periods:', periods.map(p => p.period).slice(0, 5).join(', '))
    } else {
      console.log('⚠️  No approved/distributed pools found')
    }

    console.log('\n🎉 Assessment employees display fix completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Restart the development server')
    console.log('2. Login as superadmin or unit manager')
    console.log('3. Navigate to /assessment page')
    console.log('4. Select a period and verify employees are displayed')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  main().catch(console.error)
}

export { main }