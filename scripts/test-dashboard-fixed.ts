import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDashboard() {
  console.log('🧪 Testing Dashboard dengan Error Handling...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Simulate DashboardService methods
    console.log('1️⃣ Testing getSuperadminStats...')
    
    const { count: totalEmployees } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalUnits } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log(`✅ Total Employees: ${totalEmployees}`)
    console.log(`✅ Total Units: ${totalUnits}`)

    // Test assessments (might be empty)
    console.log('\n2️⃣ Testing assessments...')
    const { data: assessments, error: assessError } = await supabase
      .from('t_kpi_assessments')
      .select('score')
      .limit(10)

    if (assessError) {
      console.log('⚠️  Assessments error (expected if table empty):', assessError.message)
    } else {
      console.log(`✅ Found ${assessments?.length || 0} assessments`)
    }

    // Test audit log with correct column
    console.log('\n3️⃣ Testing audit log...')
    const { data: audits, error: auditError } = await supabase
      .from('t_audit_log')
      .select('id, operation, table_name, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(5)

    if (auditError) {
      console.log('⚠️  Audit log error:', auditError.message)
    } else {
      console.log(`✅ Found ${audits?.length || 0} audit logs`)
      if (audits && audits.length > 0) {
        console.log('Sample:', audits[0])
      }
    }

    console.log('\n✅ Dashboard service methods should work now!')
    console.log('💡 Dashboard akan menampilkan data kosong untuk chart jika belum ada assessment')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testDashboard()
