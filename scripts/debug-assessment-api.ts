#!/usr/bin/env tsx

import { createClient } from '@/lib/supabase/server'

async function debugAssessmentAPI() {
  console.log('🔍 Debugging Assessment API...')
  
  try {
    const supabase = await createClient()
    
    // Test 1: Check available periods
    console.log('\n1. Checking available periods...')
    const { data: periods, error: periodsError } = await supabase
      .from('t_pool')
      .select('period, status')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })
    
    if (periodsError) {
      console.error('❌ Periods error:', periodsError)
    } else {
      console.log('✅ Available periods:', periods)
    }
    
    // Test 2: Check employees
    console.log('\n2. Checking employees...')
    const { data: employees, error: employeesError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, is_active')
      .eq('is_active', true)
    
    if (employeesError) {
      console.error('❌ Employees error:', employeesError)
    } else {
      console.log('✅ Active employees:', employees?.length)
      employees?.forEach(emp => {
        console.log(`  - ${emp.full_name} (${emp.role}) - Unit: ${emp.unit_id}`)
      })
    }
    
    // Test 3: Check view directly
    console.log('\n3. Checking v_assessment_status view...')
    const { data: viewData, error: viewError } = await supabase
      .from('v_assessment_status')
      .select('*')
      .eq('period', '2026-01')
      .limit(5)
    
    if (viewError) {
      console.error('❌ View error:', viewError)
    } else {
      console.log('✅ View data:', viewData?.length, 'records')
      viewData?.forEach(record => {
        console.log(`  - ${record.full_name} (${record.unit_name}) - Status: ${record.status}`)
      })
    }
    
    // Test 4: Test with service role (bypass RLS)
    console.log('\n4. Testing with service role...')
    const serviceSupabase = createClient({ 
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      options: {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    })
    
    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('v_assessment_status')
      .select('*')
      .eq('period', '2026-01')
      .limit(5)
    
    if (serviceError) {
      console.error('❌ Service role error:', serviceError)
    } else {
      console.log('✅ Service role data:', serviceData?.length, 'records')
    }
    
    // Test 5: Check current auth user
    console.log('\n5. Checking current auth user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
    } else if (user) {
      console.log('✅ Current user:', user.id)
      console.log('   Email:', user.email)
      console.log('   Metadata:', user.user_metadata)
      
      // Check employee record for this user
      const { data: empRecord, error: empError } = await supabase
        .from('m_employees')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (empError) {
        console.error('❌ Employee record error:', empError)
      } else {
        console.log('✅ Employee record:', empRecord)
      }
    } else {
      console.log('❌ No authenticated user')
    }
    
  } catch (error) {
    console.error('💥 Exception:', error)
  }
}

debugAssessmentAPI()