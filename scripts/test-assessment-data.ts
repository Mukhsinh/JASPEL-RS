#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

async function testAssessmentData() {
  console.log('🔍 Testing Assessment Data...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // Test 1: Check periods
    console.log('\n1. Available periods:')
    const { data: periods, error: periodsError } = await supabase
      .from('t_pool')
      .select('period, status')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })
    
    if (periodsError) {
      console.error('❌ Periods error:', periodsError)
    } else {
      console.log('✅ Periods:', periods)
    }
    
    // Test 2: Check employees
    console.log('\n2. Active employees:')
    const { data: employees, error: employeesError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, user_id, is_active')
      .eq('is_active', true)
    
    if (employeesError) {
      console.error('❌ Employees error:', employeesError)
    } else {
      console.log(`✅ Found ${employees?.length} employees:`)
      employees?.forEach(emp => {
        console.log(`  - ${emp.full_name} (${emp.role}) - Unit: ${emp.unit_id}`)
      })
    }
    
    // Test 3: Check view data
    console.log('\n3. Assessment status view:')
    const { data: viewData, error: viewError } = await supabase
      .from('v_assessment_status')
      .select('*')
      .eq('period', '2026-01')
    
    if (viewError) {
      console.error('❌ View error:', viewError)
    } else {
      console.log(`✅ Found ${viewData?.length} assessment records:`)
      viewData?.forEach(record => {
        console.log(`  - ${record.full_name} (${record.unit_name}) - ${record.status} - ${record.total_indicators} indicators`)
      })
    }
    
    // Test 4: Check KPI structure
    console.log('\n4. KPI structure:')
    const { data: categories, error: catError } = await supabase
      .from('m_kpi_categories')
      .select('id, name, unit_id, is_active')
      .eq('is_active', true)
    
    if (catError) {
      console.error('❌ Categories error:', catError)
    } else {
      console.log(`✅ Found ${categories?.length} categories`)
      
      for (const cat of categories || []) {
        const { data: indicators } = await supabase
          .from('m_kpi_indicators')
          .select('id, name')
          .eq('category_id', cat.id)
          .eq('is_active', true)
        
        console.log(`  - ${cat.name}: ${indicators?.length || 0} indicators`)
      }
    }
    
    // Test 5: Simulate API call logic
    console.log('\n5. Simulating API call for superadmin:')
    const testPeriod = '2026-01'
    const testUnitId = '8914356c-4ec8-4bd7-bc5e-5fb619f6c3f2' // MEDIS unit
    
    // Get assessment status for specific unit (like unit manager would see)
    const { data: unitData, error: unitError } = await supabase
      .from('v_assessment_status')
      .select('*')
      .eq('unit_id', testUnitId)
      .eq('period', testPeriod)
      .order('full_name')
    
    if (unitError) {
      console.error('❌ Unit data error:', unitError)
    } else {
      console.log(`✅ Unit ${testUnitId} has ${unitData?.length} employees for assessment`)
      unitData?.forEach(emp => {
        console.log(`  - ${emp.full_name}: ${emp.status} (${emp.assessed_indicators}/${emp.total_indicators})`)
      })
    }
    
  } catch (error) {
    console.error('💥 Exception:', error)
  }
}

testAssessmentData()