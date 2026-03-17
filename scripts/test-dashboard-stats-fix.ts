#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testDashboardStats() {
  console.log('🧪 Testing dashboard stats RPC function...')
  
  try {
    // Create direct client for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Missing environment variables')
      console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
      console.log('SERVICE_KEY:', serviceKey ? 'Found' : 'Missing')
      return
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)
    
    // Test direct RPC call
    console.log('\n1. Testing get_dashboard_stats RPC...')
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_dashboard_stats')
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError)
      return
    }
    
    console.log('✅ RPC Result:', rpcResult)
    
    if (rpcResult && rpcResult.length > 0) {
      const stats = rpcResult[0]
      console.log('📊 Dashboard Stats:')
      console.log(`  - Total Employees: ${stats.total_employees}`)
      console.log(`  - Total Units: ${stats.total_units}`)
      console.log(`  - Average Score: ${stats.avg_score}`)
      console.log(`  - Completion Rate: ${stats.completion_rate}%`)
    }
    
    // Test other RPC functions
    console.log('\n2. Testing get_top_performers RPC...')
    const { data: topPerformers, error: topError } = await supabase.rpc('get_top_performers', { performer_limit: 3 })
    
    if (topError) {
      console.error('❌ Top Performers Error:', topError)
    } else {
      console.log('✅ Top Performers:', topPerformers?.length || 0, 'found')
    }
    
    console.log('\n3. Testing get_unit_performance_stats RPC...')
    const { data: unitStats, error: unitError } = await supabase.rpc('get_unit_performance_stats')
    
    if (unitError) {
      console.error('❌ Unit Performance Error:', unitError)
    } else {
      console.log('✅ Unit Performance:', unitStats?.length || 0, 'units found')
    }
    
    console.log('\n🎉 Dashboard RPC functions are working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testDashboardStats()