#!/usr/bin/env tsx

/**
 * Test script to verify sub-indicator form permissions are working
 * This tests the RLS policies fix for the "permission denied for table users" error
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSubIndicatorPermissions() {
  console.log('🧪 Testing Sub-Indicator Form Permissions...\n')

  try {
    // 1. Get a test superadmin user
    console.log('1️⃣ Getting superadmin user...')
    const { data: superadmin, error: superadminError } = await supabase
      .from('m_employees')
      .select('user_id, email, role')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .single()

    if (superadminError || !superadmin) {
      console.error('❌ No active superadmin found:', superadminError)
      return false
    }

    console.log('✅ Found superadmin:', superadmin.email)

    // 2. Get a test indicator to add sub-indicator to
    console.log('\n2️⃣ Getting test indicator...')
    const { data: indicator, error: indicatorError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name, category_id')
      .limit(1)
      .single()

    if (indicatorError || !indicator) {
      console.error('❌ No indicator found:', indicatorError)
      return false
    }

    console.log('✅ Found indicator:', indicator.name)

    // 3. Create a client with superadmin auth (simulate browser client)
    console.log('\n3️⃣ Testing sub-indicator creation with superadmin auth...')
    
    // First, sign in as superadmin to get auth session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: superadmin.email,
      password: 'superadmin123' // Default password from setup
    })

    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return false
    }

    console.log('✅ Authenticated as superadmin')

    // 4. Try to create a sub-indicator (this should work now)
    const testSubIndicator = {
      indicator_id: indicator.id,
      code: 'TEST-001',
      name: 'Test Sub Indicator',
      description: 'Test sub indicator for permission testing',
      weight_percentage: 25.0,
      target_value: 100.0,
      measurement_unit: 'Persen',
      scoring_criteria: [
        { score: 1, min_value: 0, max_value: 20, label: 'Sangat Kurang' },
        { score: 2, min_value: 21, max_value: 40, label: 'Kurang' },
        { score: 3, min_value: 41, max_value: 60, label: 'Cukup' },
        { score: 4, min_value: 61, max_value: 80, label: 'Baik' },
        { score: 5, min_value: 81, max_value: 100, label: 'Sangat Baik' }
      ],
      is_active: true
    }

    const { data: newSubIndicator, error: createError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(testSubIndicator)
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create sub-indicator:', createError.message)
      return false
    }

    console.log('✅ Successfully created sub-indicator:', newSubIndicator.name)

    // 5. Test update operation
    console.log('\n4️⃣ Testing sub-indicator update...')
    const { error: updateError } = await supabase
      .from('m_kpi_sub_indicators')
      .update({ 
        name: 'Updated Test Sub Indicator',
        weight_percentage: 30.0 
      })
      .eq('id', newSubIndicator.id)

    if (updateError) {
      console.error('❌ Failed to update sub-indicator:', updateError.message)
      return false
    }

    console.log('✅ Successfully updated sub-indicator')

    // 6. Clean up - delete test sub-indicator
    console.log('\n5️⃣ Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', newSubIndicator.id)

    if (deleteError) {
      console.error('❌ Failed to delete test sub-indicator:', deleteError.message)
    } else {
      console.log('✅ Successfully cleaned up test data')
    }

    // 7. Sign out
    await supabase.auth.signOut()

    console.log('\n🎉 All sub-indicator permission tests passed!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function testUnitManagerPermissions() {
  console.log('\n🧪 Testing Unit Manager Permissions...\n')

  try {
    // Get a unit manager
    const { data: unitManager, error: managerError } = await supabase
      .from('m_employees')
      .select('user_id, email, role, unit_id')
      .eq('role', 'unit_manager')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (managerError || !unitManager) {
      console.log('ℹ️ No unit manager found, skipping unit manager test')
      return true
    }

    console.log('✅ Found unit manager:', unitManager.email)

    // Get an indicator for their unit
    const { data: indicator, error: indicatorError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name, category_id, m_kpi_categories!inner(unit_id)')
      .eq('m_kpi_categories.unit_id', unitManager.unit_id)
      .limit(1)
      .single()

    if (indicatorError || !indicator) {
      console.log('ℹ️ No indicator found for unit manager unit, skipping test')
      return true
    }

    // Try to authenticate as unit manager
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: unitManager.email,
      password: 'manager123' // Default password
    })

    if (authError) {
      console.log('ℹ️ Could not authenticate unit manager, skipping test')
      return true
    }

    console.log('✅ Authenticated as unit manager')

    // Try to create sub-indicator for their unit
    const testSubIndicator = {
      indicator_id: indicator.id,
      code: 'MGR-001',
      name: 'Manager Test Sub Indicator',
      weight_percentage: 20.0,
      target_value: 100.0,
      is_active: true
    }

    const { data: newSubIndicator, error: createError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(testSubIndicator)
      .select()
      .single()

    if (createError) {
      console.error('❌ Unit manager failed to create sub-indicator:', createError.message)
      return false
    }

    console.log('✅ Unit manager successfully created sub-indicator')

    // Clean up
    await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', newSubIndicator.id)

    await supabase.auth.signOut()

    console.log('✅ Unit manager permissions test passed!')
    return true

  } catch (error) {
    console.error('❌ Unit manager test error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Sub-Indicator Permissions Test\n')

  const superadminTest = await testSubIndicatorPermissions()
  const unitManagerTest = await testUnitManagerPermissions()

  if (superadminTest && unitManagerTest) {
    console.log('\n🎉 All permission tests passed! The sub-indicator form should work now.')
    process.exit(0)
  } else {
    console.log('\n❌ Some tests failed. Please check the RLS policies.')
    process.exit(1)
  }
}

main().catch(console.error)