#!/usr/bin/env tsx

/**
 * Simple test to verify sub-indicator RLS policies are fixed
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRLSPolicies() {
  console.log('🧪 Testing Sub-Indicator RLS Policies...\n')

  try {
    // 1. Check if we can query the policies
    console.log('1️⃣ Checking RLS policies...')
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'm_kpi_sub_indicators' ORDER BY policyname;`
      })

    if (policyError) {
      console.error('❌ Error checking policies:', policyError)
      return false
    }

    console.log('✅ Current RLS policies:')
    if (policies && policies.length > 0) {
      policies.forEach((policy: any) => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('   - No policies found')
    }

    // 2. Get a superadmin user
    console.log('\n2️⃣ Getting superadmin user...')
    const { data: superadmin, error: superadminError } = await supabase
      .from('m_employees')
      .select('user_id, full_name, role')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (superadminError || !superadmin) {
      console.error('❌ No superadmin found:', superadminError)
      return false
    }

    console.log('✅ Found superadmin:', superadmin.full_name)

    // 3. Get an indicator to test with
    console.log('\n3️⃣ Getting test indicator...')
    const { data: indicator, error: indicatorError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name')
      .limit(1)
      .single()

    if (indicatorError || !indicator) {
      console.error('❌ No indicator found:', indicatorError)
      return false
    }

    console.log('✅ Found indicator:', indicator.name)

    // 4. Test direct insert with service role (should work)
    console.log('\n4️⃣ Testing direct insert with service role...')
    const testSubIndicator = {
      indicator_id: indicator.id,
      code: 'RLS-TEST-001',
      name: 'RLS Test Sub Indicator',
      weight_percentage: 25.0,
      target_value: 100.0,
      is_active: true
    }

    const { data: newSubIndicator, error: insertError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(testSubIndicator)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Service role insert failed:', insertError.message)
      return false
    }

    console.log('✅ Service role insert successful')

    // 5. Test update
    console.log('\n5️⃣ Testing update...')
    const { error: updateError } = await supabase
      .from('m_kpi_sub_indicators')
      .update({ name: 'Updated RLS Test Sub Indicator' })
      .eq('id', newSubIndicator.id)

    if (updateError) {
      console.error('❌ Service role update failed:', updateError.message)
      return false
    }

    console.log('✅ Service role update successful')

    // 6. Clean up
    console.log('\n6️⃣ Cleaning up...')
    const { error: deleteError } = await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', newSubIndicator.id)

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message)
    } else {
      console.log('✅ Cleanup successful')
    }

    console.log('\n🎉 RLS policies test completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting RLS Policies Test\n')

  const success = await testRLSPolicies()

  if (success) {
    console.log('\n✅ RLS policies are working correctly!')
    console.log('The sub-indicator form should now work without permission errors.')
  } else {
    console.log('\n❌ RLS policies test failed.')
  }

  process.exit(success ? 0 : 1)
}

main().catch(console.error)