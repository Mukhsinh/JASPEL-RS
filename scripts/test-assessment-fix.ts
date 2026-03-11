import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testAssessmentFix() {
  console.log('🧪 Testing Assessment Page Fixes...\n')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test 1: Check if m_kpi_sub_indicators table is accessible
    console.log('1. Testing m_kpi_sub_indicators table access...')
    const { data: subIndicators, error: subError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('id, code, name')
      .limit(5)
    
    if (subError) {
      console.log('❌ Sub indicators error:', subError.message)
    } else {
      console.log('✅ Sub indicators accessible:', subIndicators?.length || 0, 'records')
    }
    
    // Test 2: Check v_assessment_status view
    console.log('\n2. Testing v_assessment_status view...')
    const { data: statusView, error: statusError } = await supabase
      .from('v_assessment_status')
      .select('employee_id, full_name, status')
      .limit(5)
    
    if (statusError) {
      console.log('❌ Assessment status error:', statusError.message)
    } else {
      console.log('✅ Assessment status accessible:', statusView?.length || 0, 'records')
    }
    
    // Test 3: Check can_assess_employee function
    console.log('\n3. Testing can_assess_employee function...')
    
    // Get a sample employee ID
    const { data: employees } = await supabase
      .from('m_employees')
      .select('id')
      .limit(1)
    
    if (employees && employees.length > 0) {
      const { data: canAssess, error: functionError } = await supabase
        .rpc('can_assess_employee', { employee_uuid: employees[0].id })
      
      if (functionError) {
        console.log('❌ Function error:', functionError.message)
      } else {
        console.log('✅ Function accessible, result:', canAssess)
      }
    }
    
    // Test 4: Test API endpoints simulation
    console.log('\n4. Testing API endpoint queries...')
    
    // Simulate what the API does - get current period
    const { data: periods } = await supabase
      .from('t_pool')
      .select('period')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })
      .limit(1)
    
    if (periods && periods.length > 0) {
      const currentPeriod = periods[0].period
      console.log('✅ Current period:', currentPeriod)
      
      // Test assessment status for period
      const { data: statusData, error: periodError } = await supabase
        .from('v_assessment_status')
        .select('*')
        .eq('period', currentPeriod)
        .limit(3)
      
      if (periodError) {
        console.log('❌ Period status error:', periodError.message)
      } else {
        console.log('✅ Period status data:', statusData?.length || 0, 'records')
      }
    }
    
    console.log('\n✅ Assessment fix test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAssessmentFix()