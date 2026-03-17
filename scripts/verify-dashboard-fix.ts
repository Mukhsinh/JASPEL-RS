#!/usr/bin/env tsx

/**
 * Verify dashboard database functions are working
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifyDashboardFix() {
  console.log('🔍 Verifying dashboard database functions...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test get_dashboard_stats function
    console.log('\n📊 Testing get_dashboard_stats...')
    const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats')
    
    if (statsError) {
      console.error('❌ Error in get_dashboard_stats:', statsError)
      return false
    }
    
    console.log('✅ Dashboard stats:', stats[0])
    
    // Test get_top_performers function
    console.log('\n🏆 Testing get_top_performers...')
    const { data: performers, error: performersError } = await supabase.rpc('get_top_performers', { performer_limit: 3 })
    
    if (performersError) {
      console.error('❌ Error in get_top_performers:', performersError)
      return false
    }
    
    console.log('✅ Top performers count:', performers?.length || 0)
    
    // Test get_unit_performance_stats function
    console.log('\n🏢 Testing get_unit_performance_stats...')
    const { data: units, error: unitsError } = await supabase.rpc('get_unit_performance_stats')
    
    if (unitsError) {
      console.error('❌ Error in get_unit_performance_stats:', unitsError)
      return false
    }
    
    console.log('✅ Unit performance count:', units?.length || 0)
    
    console.log('\n🎉 All dashboard functions working correctly!')
    console.log('✅ Dashboard error should be fixed now!')
    
    return true
    
  } catch (error) {
    console.error('❌ Error verifying dashboard fix:', error)
    return false
  }
}

verifyDashboardFix().then(success => {
  process.exit(success ? 0 : 1)
})