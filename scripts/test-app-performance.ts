#!/usr/bin/env tsx

/**
 * Simple performance test for localhost
 */

import { createClient } from '@/lib/supabase/client'

async function testAppPerformance() {
  console.log('🚀 Testing App Performance...')
  
  const supabase = createClient()
  
  try {
    // Test 1: Basic query performance
    console.log('\n1. Testing basic queries...')
    
    const start1 = Date.now()
    const { data: units, error: unitError } = await supabase
      .from('m_units')
      .select('id, name')
      .eq('is_active', true)
      .limit(10)
    const time1 = Date.now() - start1
    
    if (unitError) {
      console.log('❌ Units query failed:', unitError.message)
    } else {
      console.log(`✅ Units query: ${time1}ms (${units?.length || 0} units)`)
    }
    
    // Test 2: Settings query
    const start2 = Date.now()
    const { data: settings, error: settingsError } = await supabase
      .from('t_settings')
      .select('value')
      .eq('key', 'company_info')
      .maybeSingle()
    const time2 = Date.now() - start2
    
    if (settingsError) {
      console.log('❌ Settings query failed:', settingsError.message)
    } else {
      console.log(`✅ Settings query: ${time2}ms`)
    }
    
    // Test 3: Assessment query
    const start3 = Date.now()
    const { data: assessments, error: assessError } = await supabase
      .from('t_kpi_assessments')
      .select('employee_id, score')
      .limit(50)
    const time3 = Date.now() - start3
    
    if (assessError) {
      console.log('❌ Assessment query failed:', assessError.message)
    } else {
      console.log(`✅ Assessment query: ${time3}ms (${assessments?.length || 0} records)`)
    }
    
    console.log('\n📊 Performance Summary:')
    console.log(`- Units: ${time1}ms`)
    console.log(`- Settings: ${time2}ms`)
    console.log(`- Assessments: ${time3}ms`)
    console.log(`- Total: ${time1 + time2 + time3}ms`)
    
    if (time1 + time2 + time3 < 500) {
      console.log('🎉 Performance is EXCELLENT (< 500ms)')
    } else if (time1 + time2 + time3 < 1000) {
      console.log('✅ Performance is GOOD (< 1s)')
    } else if (time1 + time2 + time3 < 2000) {
      console.log('⚠️ Performance is ACCEPTABLE (< 2s)')
    } else {
      console.log('🐌 Performance needs improvement (> 2s)')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAppPerformance().catch(console.error)