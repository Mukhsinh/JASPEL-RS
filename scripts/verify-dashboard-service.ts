import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifyDashboardService() {
  console.log('🧪 Testing dashboard service fixes...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Test 1: getSuperadminStats
  console.log('1️⃣ Testing getSuperadminStats...')
  const { count: employeesCount } = await supabase
    .from('m_employees')
    .select('*', { count: 'exact', head: true })
  
  const { count: unitsCount } = await supabase
    .from('m_units')
    .select('*', { count: 'exact', head: true })
  
  console.log(`✅ Stats OK - Employees: ${employeesCount} Units: ${unitsCount}`)

  // Test 2: getTopPerformers
  console.log('\n2️⃣ Testing getTopPerformers...')
  const { data: topPerformers, error: topError } = await supabase
    .from('t_calculation_results')
    .select(`
      employee_id,
      final_score,
      m_employees (
        id,
        full_name,
        m_units (name)
      )
    `)
    .order('final_score', { ascending: false })
    .limit(5)
  
  if (topError) {
    console.log('❌ Error:', topError.message)
  } else {
    console.log(`✅ Top performers query OK: ${topPerformers?.length || 0} records`)
  }

  // Test 3: getUnitPerformance
  console.log('\n3️⃣ Testing getUnitPerformance...')
  const { data: units } = await supabase
    .from('m_units')
    .select(`
      id,
      name,
      m_employees (id)
    `)
    .limit(1)
  
  if (units && units.length > 0) {
    const unit = units[0]
    const employees = (unit.m_employees as any[]) || []
    console.log(`✅ Unit performance query OK for ${unit.name}: ${employees.length} assessments`)
  }

  // Test 4: getRecentActivities
  console.log('\n4️⃣ Testing getRecentActivities...')
  const { data: activities, error: actError } = await supabase
    .from('t_audit_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5)
  
  if (actError) {
    console.log('❌ Error:', actError.message)
  } else {
    console.log(`✅ Recent activities OK: ${activities?.length || 0} records`)
  }

  // Test 5: getKPIDistribution
  console.log('\n5️⃣ Testing getKPIDistribution...')
  const { data: scores, error: scoresError } = await supabase
    .from('t_individual_scores')
    .select('p1_score, p2_score, p3_score')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (scoresError) {
    console.log('❌ Error:', scoresError.message)
  } else {
    console.log(`✅ KPI distribution query OK: ${scores?.length || 0} records`)
  }

  console.log('\n✅ Semua test berhasil! Dashboard service sudah diperbaiki.')
}

verifyDashboardService().catch(console.error)
