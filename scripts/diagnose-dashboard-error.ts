import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseDashboard() {
  console.log('🔍 Diagnosing Dashboard Error...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Check if superadmin user exists
    console.log('1. Checking superadmin user...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }

    console.log(`✅ Found ${authUsers.users.length} auth users`)
    
    if (authUsers.users.length === 0) {
      console.log('⚠️  No users found in auth.users')
      return
    }

    const firstUser = authUsers.users[0]
    console.log(`   First user: ${firstUser.email} (${firstUser.id})`)

    // 2. Check if employee record exists
    console.log('\n2. Checking employee record...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select(`
        id, 
        full_name, 
        role, 
        unit_id,
        user_id,
        m_units (
          id,
          name
        )
      `)
      .eq('user_id', firstUser.id)
      .single()

    if (empError) {
      console.error('❌ Employee query error:', empError.message)
      console.log('   This is likely the cause of the 500 error!')
      
      // Check if any employees exist
      const { data: allEmployees, error: allEmpError } = await supabase
        .from('m_employees')
        .select('id, full_name, user_id, role')
        .limit(5)
      
      if (!allEmpError && allEmployees) {
        console.log(`\n   Found ${allEmployees.length} employees in database:`)
        allEmployees.forEach(emp => {
          console.log(`   - ${emp.full_name} (user_id: ${emp.user_id || 'NULL'}, role: ${emp.role})`)
        })
      }
      
      return
    }

    console.log(`✅ Employee found: ${employee.full_name}`)
    console.log(`   Role: ${employee.role}`)
    console.log(`   Unit: ${employee.m_units ? (employee.m_units as any).name : 'No unit'}`)

    // 3. Test dashboard service methods
    console.log('\n3. Testing dashboard queries...')
    
    // Test total employees count
    const { count: empCount, error: countError } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Count error:', countError.message)
    } else {
      console.log(`✅ Total employees: ${empCount}`)
    }

    // Test total units count
    const { count: unitCount, error: unitCountError } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
    
    if (unitCountError) {
      console.error('❌ Unit count error:', unitCountError.message)
    } else {
      console.log(`✅ Total units: ${unitCount}`)
    }

    // Test assessments query
    const { data: assessments, error: assessError } = await supabase
      .from('t_kpi_assessments')
      .select('final_score')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (assessError) {
      console.log(`⚠️  Assessments query error: ${assessError.message}`)
      console.log('   (This is OK if no assessments exist yet)')
    } else {
      console.log(`✅ Found ${assessments?.length || 0} assessments`)
    }

    // Test audit logs
    const { data: audits, error: auditError } = await supabase
      .from('t_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (auditError) {
      console.log(`⚠️  Audit logs error: ${auditError.message}`)
    } else {
      console.log(`✅ Found ${audits?.length || 0} audit logs`)
    }

    console.log('\n✅ Dashboard diagnosis complete!')
    console.log('\nIf you see errors above, those are likely causing the 500 error.')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    console.error(error)
  }
}

diagnoseDashboard()
