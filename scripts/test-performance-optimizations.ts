#!/usr/bin/env tsx

/**
 * Test script to verify performance optimizations
 */

import { createClient } from '@/lib/supabase/server'

async function testPerformanceOptimizations() {
  console.log('🚀 Testing Performance Optimizations...')
  
  const supabase = await createClient()
  
  try {
    // Test 1: Database functions
    console.log('\n1. Testing database functions...')
    
    const start1 = Date.now()
    const { data: unitStats, error: unitError } = await supabase.rpc('get_unit_performance_stats')
    const time1 = Date.now() - start1
    
    if (unitError) {
      console.log('❌ Unit performance function failed:', unitError.message)
    } else {
      console.log(`✅ Unit performance function: ${time1}ms (${unitStats?.length || 0} units)`)
    }
    
    const start2 = Date.now()
    const { data: topPerformers, error: topError } = await supabase.rpc('get_top_performers', { performer_limit: 5 })
    const time2 = Date.now() - start2
    
    if (topError) {
      console.log('❌ Top performers function failed:', topError.message)
    } else {
      console.log(`✅ Top performers function: ${time2}ms (${topPerformers?.length || 0} performers)`)
    }
    
    // Test 2: Index performance
    console.log('\n2. Testing index performance...')
    
    const start3 = Date.now()
    const { data: assessments, error: assessError } = await supabase
      .from('t_kpi_assessments')
      .select('employee_id, score')
      .limit(100)
    const time3 = Date.now() - start3
    
    if (assessError) {
      console.log('❌ Assessment query failed:', assessError.message)
    } else {
      console.log(`✅ Assessment query with index: ${time3}ms (${assessments?.length || 0} records)`)
    }
    
    // Test 3: Settings query
    console.log('\n3. Testing settings query...')
    
    const start4 = Date.now()
    const { data: settings, error: settingsError } = await supabase
      .from('t_settings')
      .select('value')
      .eq('key', 'company_info')
      .maybeSingle()
    const time4 = Date.now() - start4
    
    if (settingsError) {
      console.log('❌ Settings query failed:', settingsError.message)
    } else {
      console.log(`✅ Settings query with index: ${time4}ms`)
    }
    
    console.log('\n📊 Performance Summary:')
    console.log(`- Unit stats: ${time1}ms`)
    console.log(`- Top performers: ${time2}ms`)
    console.log(`- Assessment query: ${time3}ms`)
    console.log(`- Settings query: ${time4}ms`)
    console.log(`- Total time: ${time1 + time2 + time3 + time4}ms`)
    
    if (time1 + time2 + time3 + time4 < 1000) {
      console.log('🎉 Performance is GOOD (< 1 second)')
    } else if (time1 + time2 + time3 + time4 < 2000) {
      console.log('⚠️ Performance is ACCEPTABLE (< 2 seconds)')
    } else {
      console.log('🐌 Performance needs improvement (> 2 seconds)')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPerformanceOptimizations().catch(console.error)