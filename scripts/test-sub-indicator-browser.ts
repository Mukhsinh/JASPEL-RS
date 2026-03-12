#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testBrowserAccess() {
  console.log('🌐 Testing Sub Indicator Form Browser Access...\n')

  try {
    // 1. Check if we have superadmin user
    console.log('1. Checking superadmin user...')
    const { data: employees, error: empError } = await supabaseService
      .from('m_employees')
      .select('*')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .limit(1)

    if (empError) {
      console.error('❌ Error fetching employees:', empError.message)
      return
    }

    if (!employees || employees.length === 0) {
      console.error('❌ No active superadmin employee found')
      return
    }

    const superadmin = employees[0]
    console.log(`✅ Found superadmin: ${superadmin.full_name}`)

    // 2. Get user email
    const { data: userData, error: userError } = await supabaseService.auth.admin.getUserById(
      superadmin.user_id
    )

    if (userError || !userData.user) {
      console.error('❌ Error getting user data:', userError?.message)
      return
    }

    console.log(`✅ User email: ${userData.user.email}`)

    // 3. Check KPI structure
    console.log('\n2. Checking KPI structure...')
    const { data: units, error: unitsError } = await supabaseService
      .from('m_units')
      .select('*')
      .eq('is_active', true)
      .order('code')
      .limit(5)

    if (unitsError) {
      console.error('❌ Error fetching units:', unitsError.message)
      return
    }

    console.log(`✅ Found ${units.length} active units`)
    units.forEach(unit => {
      console.log(`   - ${unit.code}: ${unit.name}`)
    })

    if (units.length === 0) {
      console.error('❌ No units found')
      return
    }

    // 4. Check categories and indicators for first unit
    const testUnit = units[0]
    console.log(`\n3. Checking KPI structure for unit: ${testUnit.code}`)

    const { data: categories, error: catError } = await supabaseService
      .from('m_kpi_categories')
      .select('*')
      .eq('unit_id', testUnit.id)
      .eq('is_active', true)

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message)
      return
    }

    console.log(`✅ Found ${categories.length} categories`)

    if (categories.length > 0) {
      const { data: indicators, error: indError } = await supabaseService
        .from('m_kpi_indicators')
        .select('*')
        .eq('category_id', categories[0].id)
        .eq('is_active', true)

      if (indError) {
        console.error('❌ Error fetching indicators:', indError.message)
        return
      }

      console.log(`✅ Found ${indicators.length} indicators`)

      if (indicators.length > 0) {
        const { data: subIndicators, error: subError } = await supabaseService
          .from('m_kpi_sub_indicators')
          .select('*')
          .eq('indicator_id', indicators[0].id)
          .eq('is_active', true)

        if (subError) {
          console.error('❌ Error fetching sub indicators:', subError.message)
          return
        }

        console.log(`✅ Found ${subIndicators.length} sub indicators`)
      }
    }

    // 5. Instructions for manual testing
    console.log('\n🎯 Manual Testing Instructions:')
    console.log('=====================================')
    console.log('1. Open browser and go to: http://localhost:3000')
    console.log(`2. Login with: ${userData.user.email}`)
    console.log('3. Password: password123')
    console.log('4. Navigate to: Konfigurasi KPI')
    console.log('5. Select unit and try to add a sub indicator')
    console.log('6. The form should now work without permission errors')
    console.log('\n✅ System is ready for testing!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testBrowserAccess().catch(console.error)