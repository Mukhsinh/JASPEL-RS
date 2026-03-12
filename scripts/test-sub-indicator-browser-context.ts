#!/usr/bin/env tsx

/**
 * Test sub-indicator creation in browser-like context
 * Simulate the exact conditions from the form
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Use anon key like in browser
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSubIndicatorBrowserContext() {
  console.log('🌐 Testing Sub-Indicator in Browser Context...\n')

  try {
    // 1. First login as superadmin
    console.log('1. Logging in as superadmin...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@jaspel.com',
      password: 'superadmin123'
    })

    if (authError) {
      console.error('❌ Login failed:', authError)
      return
    }

    console.log('✅ Logged in as:', authData.user.email)
    console.log('   Role:', authData.user.user_metadata?.role)

    // 2. Get an existing indicator
    console.log('\n2. Getting existing indicator...')
    const { data: indicators, error: indicatorsError } = await supabase
      .from('m_kpi_indicators')
      .select('*')
      .limit(1)

    if (indicatorsError) {
      console.error('❌ Error getting indicators:', indicatorsError)
      return
    }

    if (!indicators || indicators.length === 0) {
      console.log('⚠️ No indicators found')
      return
    }

    const testIndicator = indicators[0]
    console.log('✅ Using indicator:', testIndicator.name)

    // 3. Get existing sub-indicators for this indicator
    console.log('\n3. Getting existing sub-indicators...')
    const { data: existingSubs, error: existingError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('*')
      .eq('indicator_id', testIndicator.id)
      .eq('is_active', true)

    if (existingError) {
      console.error('❌ Error getting existing sub-indicators:', existingError)
      return
    }

    console.log('📊 Existing sub-indicators:', existingSubs?.length || 0)
    
    // Calculate current total weight
    const currentTotalWeight = existingSubs?.reduce((sum, sub) => sum + Number(sub.weight_percentage), 0) || 0
    console.log('   Current total weight:', currentTotalWeight + '%')

    // 4. Test creating sub-indicator with exact form data structure
    console.log('\n4. Testing sub-indicator creation...')
    
    const formData = {
      indicator_id: testIndicator.id,
      name: 'Test Sub Indicator Browser',
      description: 'Test from browser context',
      weight_percentage: 25.5,
      target_value: 100,
      measurement_unit: '%',
      scoring_criteria: [
        { score: 20, label: 'Sangat Kurang' },
        { score: 40, label: 'Kurang' },
        { score: 60, label: 'Cukup' },
        { score: 80, label: 'Baik' },
        { score: 100, label: 'Sangat Baik' }
      ],
      is_active: true
    }

    // Generate code like in the form
    const existingCodes = existingSubs?.map(s => {
      const match = s.code.match(/(\d+)$/)
      return match ? parseInt(match[1]) : 0
    }) || []
    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0
    const newCode = `SUB${String(maxCode + 1).padStart(3, '0')}`

    const insertData = {
      ...formData,
      code: newCode
    }

    console.log('📝 Insert data:', JSON.stringify(insertData, null, 2))

    const { data: createdSub, error: createError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Create failed:', createError)
      console.error('   Code:', createError.code)
      console.error('   Message:', createError.message)
      console.error('   Details:', createError.details)
      console.error('   Hint:', createError.hint)
      
      // Try to get more specific error info
      if (createError.code === '23514') {
        console.log('\n🔍 Check constraint violation detected')
        console.log('   This usually means a constraint is not satisfied')
      }
      
      return
    }

    console.log('✅ Sub-indicator created successfully!')
    console.log('   ID:', createdSub.id)
    console.log('   Code:', createdSub.code)
    console.log('   Weight:', createdSub.weight_percentage + '%')
    console.log('   Scoring criteria type:', typeof createdSub.scoring_criteria)
    console.log('   Scoring criteria length:', createdSub.scoring_criteria?.length)

    // 5. Test updating the sub-indicator
    console.log('\n5. Testing sub-indicator update...')
    
    const updateData = {
      weight_percentage: 30.0,
      scoring_criteria: [
        { score: 25, label: 'Sangat Kurang Sekali' },
        { score: 50, label: 'Kurang' },
        { score: 75, label: 'Cukup Baik' },
        { score: 100, label: 'Sangat Baik' }
      ]
    }

    const { data: updatedSub, error: updateError } = await supabase
      .from('m_kpi_sub_indicators')
      .update(updateData)
      .eq('id', createdSub.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update failed:', updateError)
    } else {
      console.log('✅ Sub-indicator updated successfully!')
      console.log('   New weight:', updatedSub.weight_percentage + '%')
      console.log('   New criteria count:', updatedSub.scoring_criteria?.length)
    }

    // 6. Clean up
    console.log('\n6. Cleaning up...')
    await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', createdSub.id)

    console.log('✅ Test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSubIndicatorBrowserContext()