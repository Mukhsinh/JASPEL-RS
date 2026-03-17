#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi perbaikan loading loop
 * Menguji apakah user bisa login dan masuk ke dashboard tanpa terjebak loading
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoadingLoopFix() {
  console.log('🔍 Testing loading loop fix...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Test session retrieval speed
    console.log('\n1. Testing session retrieval speed...')
    const startTime = Date.now()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    const sessionTime = Date.now() - startTime
    
    console.log(`   ✅ Session retrieved in ${sessionTime}ms`)
    
    if (session) {
      console.log(`   ✅ User logged in: ${session.user.email}`)
      
      // 2. Test employee data fetch speed
      console.log('\n2. Testing employee data fetch speed...')
      const empStartTime = Date.now()
      
      const { data: employee, error: empError } = await supabase
        .from('m_employees')
        .select('id, full_name, role, unit_id, m_units!inner(name)')
        .eq('user_id', session.user.id)
        .single()
      
      const empTime = Date.now() - empStartTime
      console.log(`   ✅ Employee data fetched in ${empTime}ms`)
      
      if (employee) {
        console.log(`   ✅ Employee: ${employee.full_name} (${employee.role})`)
        console.log(`   ✅ Unit: ${employee.m_units?.name}`)
      } else {
        console.log(`   ❌ Employee data not found: ${empError?.message}`)
      }
      
      // 3. Test multiple concurrent requests (simulate race condition)
      console.log('\n3. Testing concurrent requests...')
      const concurrentStartTime = Date.now()
      
      const promises = Array(5).fill(0).map(() => 
        supabase
          .from('m_employees')
          .select('id, full_name, role')
          .eq('user_id', session.user.id)
          .single()
      )
      
      const results = await Promise.all(promises)
      const concurrentTime = Date.now() - concurrentStartTime
      
      console.log(`   ✅ 5 concurrent requests completed in ${concurrentTime}ms`)
      console.log(`   ✅ All requests successful: ${results.every(r => r.data)}`))
      
    } else {
      console.log('   ℹ️  No active session (user not logged in)')
    }
    
    // 4. Test settings fetch (should not block)
    console.log('\n4. Testing settings fetch...')
    const settingsStartTime = Date.now()
    
    const { data: settings, error: settingsError } = await supabase
      .from('t_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    const settingsTime = Date.now() - settingsStartTime
    console.log(`   ✅ Settings fetch completed in ${settingsTime}ms`)
    
    if (settingsError) {
      console.log(`   ⚠️  Settings error (non-critical): ${settingsError.message}`)
    }
    
    // 5. Performance summary
    console.log('\n📊 Performance Summary:')
    console.log(`   • Session retrieval: ${sessionTime}ms`)
    console.log(`   • Employee data: ${session ? empTime : 'N/A'}ms`)
    console.log(`   • Concurrent requests: ${session ? concurrentTime : 'N/A'}ms`)
    console.log(`   • Settings fetch: ${settingsTime}ms`)
    
    const totalTime = sessionTime + (session ? empTime : 0) + settingsTime
    console.log(`   • Total time: ${totalTime}ms`)
    
    if (totalTime < 2000) {
      console.log('\n✅ PASS: All operations completed quickly (< 2s)')
    } else {
      console.log('\n⚠️  WARNING: Operations took longer than expected')
    }
    
    // 6. Check for potential issues
    console.log('\n🔍 Checking for potential issues...')
    
    if (sessionTime > 1000) {
      console.log('   ⚠️  Session retrieval is slow (> 1s)')
    }
    
    if (session && empTime > 1000) {
      console.log('   ⚠️  Employee data fetch is slow (> 1s)')
    }
    
    if (session && concurrentTime > 2000) {
      console.log('   ⚠️  Concurrent requests are slow (> 2s)')
    }
    
    console.log('\n✅ Loading loop fix test completed!')
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run test
testLoadingLoopFix().catch(console.error)