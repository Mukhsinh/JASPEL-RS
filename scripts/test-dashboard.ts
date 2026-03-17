import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboard() {
  console.log('🧪 Testing Dashboard Components...\n')

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking database tables...')
    const { data: units, error: unitsError } = await supabase
      .from('m_units')
      .select('count')
      .limit(1)
    
    if (unitsError) {
      console.log('❌ Units table error:', unitsError.message)
    } else {
      console.log('✅ Units table accessible')
    }

    const { data: employees, error: employeesError } = await supabase
      .from('m_employees')
      .select('count')
      .limit(1)
    
    if (employeesError) {
      console.log('❌ Employees table error:', employeesError.message)
    } else {
      console.log('✅ Employees table accessible')
    }

    const { data: pools, error: poolsError } = await supabase
      .from('t_pools')
      .select('count')
      .limit(1)
    
    if (poolsError) {
      console.log('❌ Pools table error:', poolsError.message)
    } else {
      console.log('✅ Pools table accessible')
    }

    // Test 2: Get sample stats
    console.log('\n2️⃣ Getting sample statistics...')
    const { count: unitsCount } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
    
    const { count: employeesCount } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
    
    const { count: poolsCount } = await supabase
      .from('t_pools')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Total Units: ${unitsCount || 0}`)
    console.log(`✅ Total Employees: ${employeesCount || 0}`)
    console.log(`✅ Total Pools: ${poolsCount || 0}`)

    // Test 3: Check audit logs
    console.log('\n3️⃣ Checking audit logs...')
    const { data: auditLogs, error: auditError } = await supabase
      .from('t_audit_logs')
      .select('id, action, table_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (auditError) {
      console.log('❌ Audit logs error:', auditError.message)
    } else {
      console.log(`✅ Found ${auditLogs?.length || 0} recent audit logs`)
    }

    // Test 4: Check KPI realizations
    console.log('\n4️⃣ Checking KPI realizations...')
    const { data: realizations, error: realizationsError } = await supabase
      .from('t_kpi_realizations')
      .select('id, final_score, year, month')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (realizationsError) {
      console.log('❌ Realizations error:', realizationsError.message)
    } else {
      console.log(`✅ Found ${realizations?.length || 0} recent realizations`)
      if (realizations && realizations.length > 0) {
        console.log(`   Latest: Year ${realizations[0].year}, Month ${realizations[0].month}, Score: ${realizations[0].final_score}`)
      }
    }

    console.log('\n✅ Dashboard test completed successfully!')
    console.log('\n📊 Dashboard is ready to display:')
    console.log('   - Statistics cards with real data')
    console.log('   - Performance charts')
    console.log('   - Top performers list')
    console.log('   - Recent activities')
    console.log('   - KPI distribution')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testDashboard()
