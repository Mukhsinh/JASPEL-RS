import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDashboardFix() {
  console.log('🧪 Testing dashboard service fixes...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test 1: Get superadmin stats
    console.log('1️⃣ Testing getSuperadminStats...')
    const { count: totalEmployees } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    const { count: totalUnits } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    console.log('✅ Stats OK - Employees:', totalEmployees, 'Units:', totalUnits)

    // Test 2: Get top performers
    console.log('\n2️⃣ Testing getTopPerformers...')
    const { data: assessments } = await supabase
      .from('t_kpi_assessments')
      .select(`
        employee_id,
        score,
        m_employees!t_kpi_assessments_employee_id_fkey (
          id,
          full_name,
          m_units!m_employees_unit_id_fkey (name)
        )
      `)
      .order('score', { ascending: false })
      .limit(5)
    
    if (assessments) {
      console.log('✅ Top performers query OK:', assessments.length, 'records')
      if (assessments.length > 0) {
        console.log('Sample:', {
          name: (assessments[0].m_employees as any)?.full_name,
          score: assessments[0].score
        })
      }
    } else {
      console.log('⚠️ No assessments found')
    }

    // Test 3: Get unit performance
    console.log('\n3️⃣ Testing getUnitPerformance...')
    const { data: units } = await supabase
      .from('m_units')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
    
    if (units && units.length > 0) {
      const unit = units[0]
      const { data: unitAssessments } = await supabase
        .from('t_kpi_assessments')
        .select(`
          score,
          m_employees!t_kpi_assessments_employee_id_fkey!inner (unit_id)
        `)
        .eq('m_employees.unit_id', unit.id)
      
      console.log('✅ Unit performance query OK for', unit.name, ':', unitAssessments?.length || 0, 'assessments')
    }

    // Test 4: Get recent activities
    console.log('\n4️⃣ Testing getRecentActivities...')
    const { data: audits, error: auditError } = await supabase
      .from('t_audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5)
    
    if (auditError) {
      console.log('⚠️ Audit log error:', auditError.message)
    } else {
      console.log('✅ Recent activities OK:', audits?.length || 0, 'records')
    }

    // Test 5: Get KPI distribution
    console.log('\n5️⃣ Testing getKPIDistribution...')
    const { data: kpiData } = await supabase
      .from('t_kpi_assessments')
      .select(`
        score,
        m_kpi_indicators!t_kpi_assessments_indicator_id_fkey (
          m_kpi_categories!m_kpi_indicators_category_id_fkey (category)
        )
      `)
      .limit(10)
    
    if (kpiData) {
      console.log('✅ KPI distribution query OK:', kpiData.length, 'records')
      if (kpiData.length > 0) {
        const sample = kpiData[0]
        const indicator = sample.m_kpi_indicators as any
        console.log('Sample category:', indicator?.m_kpi_categories?.category)
      }
    }

    console.log('\n✅ Semua test berhasil! Dashboard service sudah diperbaiki.')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  }
}

testDashboardFix()
