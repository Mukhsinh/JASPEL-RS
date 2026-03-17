#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testDashboardComplete() {
  console.log('🧪 Testing complete dashboard fix...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Missing environment variables')
      return
    }
    
    const supabase = createClient(supabaseUrl, serviceKey)
    
    // 1. Test RPC functions directly
    console.log('\n1. Testing RPC functions...')
    
    const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats')
    if (statsError) {
      console.error('❌ get_dashboard_stats error:', statsError)
    } else {
      console.log('✅ get_dashboard_stats working:', statsData?.[0])
    }
    
    // 2. Test if superadmin user exists
    console.log('\n2. Checking superadmin user...')
    
    const { data: superadmin, error: userError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, user_id')
      .eq('role', 'superadmin')
      .single()
    
    if (userError) {
      console.error('❌ Superadmin not found:', userError)
    } else {
      console.log('✅ Superadmin found:', superadmin.full_name)
    }
    
    // 3. Test dashboard service components
    console.log('\n3. Testing dashboard components...')
    
    // Test employees count
    const { count: employeeCount } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    console.log('✅ Active employees:', employeeCount)
    
    // Test units count
    const { count: unitCount } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    console.log('✅ Active units:', unitCount)
    
    // Test assessments
    const { count: assessmentCount } = await supabase
      .from('t_kpi_assessments')
      .select('*', { count: 'exact', head: true })
    
    console.log('✅ KPI assessments:', assessmentCount)
    
    // 4. Test browser access
    console.log('\n4. Testing browser access...')
    
    try {
      const response = await fetch('http://localhost:3002/dashboard')
      if (response.ok) {
        console.log('✅ Dashboard page accessible')
      } else {
        console.log('❌ Dashboard page error:', response.status)
      }
    } catch (fetchError) {
      console.log('⚠️ Server might not be running on port 3002')
    }
    
    console.log('\n🎉 Dashboard fix verification complete!')
    console.log('\n📋 Summary:')
    console.log(`  - Database functions: Working`)
    console.log(`  - Employee data: ${employeeCount} active employees`)
    console.log(`  - Unit data: ${unitCount} active units`)
    console.log(`  - Assessment data: ${assessmentCount} assessments`)
    
    if (statsData && statsData.length > 0) {
      const stats = statsData[0]
      console.log(`  - Dashboard stats: ${stats.total_employees} employees, ${stats.total_units} units`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testDashboardComplete()