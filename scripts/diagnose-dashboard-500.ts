import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseDashboard() {
  console.log('🔍 Mendiagnosis error dashboard...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test 1: Check m_employees table
    console.log('1️⃣ Memeriksa tabel m_employees...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id')
      .limit(5)
    
    if (empError) {
      console.error('❌ Error m_employees:', empError.message)
    } else {
      console.log('✅ m_employees OK:', employees?.length, 'records')
    }

    // Test 2: Check m_employees with m_units join
    console.log('\n2️⃣ Memeriksa join m_employees dengan m_units...')
    const { data: empWithUnits, error: joinError } = await supabase
      .from('m_employees')
      .select(`
        id, 
        full_name, 
        role, 
        unit_id,
        m_units!m_employees_unit_id_fkey (name)
      `)
      .limit(5)
    
    if (joinError) {
      console.error('❌ Error join:', joinError.message)
      console.error('Detail:', joinError)
    } else {
      console.log('✅ Join OK:', empWithUnits?.length, 'records')
      console.log('Sample:', JSON.stringify(empWithUnits?.[0], null, 2))
    }

    // Test 3: Check t_kpi_assessments
    console.log('\n3️⃣ Memeriksa tabel t_kpi_assessments...')
    const { data: assessments, error: assError } = await supabase
      .from('t_kpi_assessments')
      .select('id, employee_id, final_score')
      .limit(5)
    
    if (assError) {
      console.error('❌ Error t_kpi_assessments:', assError.message)
    } else {
      console.log('✅ t_kpi_assessments OK:', assessments?.length, 'records')
    }

    // Test 4: Check t_audit_logs
    console.log('\n4️⃣ Memeriksa tabel t_audit_logs...')
    const { data: audits, error: auditError } = await supabase
      .from('t_audit_logs')
      .select('id, action, created_at')
      .limit(5)
    
    if (auditError) {
      console.error('❌ Error t_audit_logs:', auditError.message)
    } else {
      console.log('✅ t_audit_logs OK:', audits?.length, 'records')
    }

    // Test 5: Check m_units
    console.log('\n5️⃣ Memeriksa tabel m_units...')
    const { data: units, error: unitError } = await supabase
      .from('m_units')
      .select('id, name')
      .limit(5)
    
    if (unitError) {
      console.error('❌ Error m_units:', unitError.message)
    } else {
      console.log('✅ m_units OK:', units?.length, 'records')
    }

    // Test 6: Complex query like dashboard
    console.log('\n6️⃣ Testing complex query seperti dashboard...')
    const { data: complexData, error: complexError } = await supabase
      .from('m_units')
      .select(`
        id,
        name,
        m_employees (
          id,
          t_kpi_assessments (final_score)
        )
      `)
      .limit(3)
    
    if (complexError) {
      console.error('❌ Error complex query:', complexError.message)
      console.error('Detail:', complexError)
    } else {
      console.log('✅ Complex query OK')
      console.log('Sample:', JSON.stringify(complexData?.[0], null, 2))
    }

    console.log('\n✅ Diagnosis selesai!')

  } catch (error: any) {
    console.error('\n❌ Error tidak terduga:', error.message)
    console.error(error)
  }
}

diagnoseDashboard()
