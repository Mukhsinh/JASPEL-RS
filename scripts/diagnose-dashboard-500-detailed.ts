import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseDashboard() {
  console.log('🔍 Mendiagnosa Dashboard Error...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Check auth user
    console.log('1️⃣ Testing auth...')
    const { data: users } = await supabase.auth.admin.listUsers()
    console.log(`✅ Found ${users.users.length} users\n`)

    // Test 2: Check m_employees table
    console.log('2️⃣ Testing m_employees query...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select(`
        id, 
        full_name, 
        role, 
        unit_id,
        m_units!m_employees_unit_id_fkey (name)
      `)
      .limit(1)

    if (empError) {
      console.error('❌ m_employees error:', empError)
    } else {
      console.log('✅ m_employees query OK')
      console.log('Sample:', JSON.stringify(employees?.[0], null, 2))
    }

    // Test 3: Check total employees count
    console.log('\n3️⃣ Testing total employees count...')
    const { count: totalEmployees, error: countError } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (countError) {
      console.error('❌ Count error:', countError)
    } else {
      console.log(`✅ Total employees: ${totalEmployees}`)
    }

    // Test 4: Check total units
    console.log('\n4️⃣ Testing total units...')
    const { count: totalUnits, error: unitsError } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (unitsError) {
      console.error('❌ Units error:', unitsError)
    } else {
      console.log(`✅ Total units: ${totalUnits}`)
    }

    // Test 5: Check t_kpi_assessments
    console.log('\n5️⃣ Testing t_kpi_assessments...')
    const { data: assessments, error: assessError } = await supabase
      .from('t_kpi_assessments')
      .select('id, score, employee_id')
      .limit(5)

    if (assessError) {
      console.error('❌ Assessments error:', assessError)
      console.log('⚠️  Table t_kpi_assessments mungkin belum ada atau kosong')
    } else {
      console.log(`✅ Found ${assessments?.length || 0} assessments`)
    }

    // Test 6: Check t_audit_log
    console.log('\n6️⃣ Testing t_audit_log...')
    const { data: audits, error: auditError } = await supabase
      .from('t_audit_log')
      .select('id, action, timestamp')
      .limit(5)

    if (auditError) {
      console.error('❌ Audit log error:', auditError)
      console.log('⚠️  Table t_audit_log mungkin belum ada')
    } else {
      console.log(`✅ Found ${audits?.length || 0} audit logs`)
    }

    // Test 7: Check complex join query
    console.log('\n7️⃣ Testing complex join query...')
    const { data: joinTest, error: joinError } = await supabase
      .from('t_kpi_assessments')
      .select(`
        score,
        m_employees!t_kpi_assessments_employee_id_fkey (
          id,
          full_name,
          m_units!m_employees_unit_id_fkey (name)
        )
      `)
      .limit(1)

    if (joinError) {
      console.error('❌ Join query error:', joinError)
      console.log('⚠️  Foreign key atau relasi bermasalah')
    } else {
      console.log('✅ Join query OK')
    }

    console.log('\n✅ Diagnosis selesai!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

diagnoseDashboard()
