#!/usr/bin/env tsx

/**
 * Debug script untuk menganalisis error 400 pada sub indicator form
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSubIndicatorError() {
  console.log('🔍 Debugging Sub-Indicator Error 400...\n')

  try {
    // 1. Check table structure
    console.log('1. Checking table structure...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('*')
      .limit(1)

    if (sampleError) {
      console.error('❌ Error accessing table:', sampleError.message)
    } else {
      console.log('✅ Table accessible')
      if (sampleData && sampleData.length > 0) {
        console.log('📋 Sample record columns:', Object.keys(sampleData[0]))
      } else {
        console.log('📋 Table is empty, checking with describe')
      }
    }

    // 2. Check if scoring_criteria column exists
    console.log('\n2. Testing column structure...')
    const testQuery = await supabase
      .from('m_kpi_sub_indicators')
      .select('scoring_criteria')
      .limit(1)

    if (testQuery.error) {
      console.log('❌ scoring_criteria column does not exist:', testQuery.error.message)
      console.log('🔧 Table still uses old score_1-5 structure')
    } else {
      console.log('✅ scoring_criteria column exists')
    }

    // 3. Check constraints
    console.log('\n3. Checking constraints...')

    // 4. Test insert with old format
    console.log('\n4. Testing insert with old format...')
    const oldFormatData = {
      indicator_id: '00000000-0000-0000-0000-000000000001', // dummy UUID
      code: 'TEST_OLD',
      name: 'Test Old Format',
      weight_percentage: 25.5,
      target_value: 100,
      measurement_unit: '%',
      score_1: 20,
      score_2: 40,
      score_3: 60,
      score_4: 80,
      score_5: 100,
      score_1_label: 'Sangat Kurang',
      score_2_label: 'Kurang',
      score_3_label: 'Cukup',
      score_4_label: 'Baik',
      score_5_label: 'Sangat Baik',
      is_active: true
    }

    const oldTest = await supabase
      .from('m_kpi_sub_indicators')
      .insert(oldFormatData)
      .select()

    if (oldTest.error) {
      console.log('❌ Old format failed:', oldTest.error.message)
    } else {
      console.log('✅ Old format works')
      // Clean up
      await supabase
        .from('m_kpi_sub_indicators')
        .delete()
        .eq('code', 'TEST_OLD')
    }

    // 5. Test insert with new format
    console.log('\n5. Testing insert with new format...')
    const newFormatData = {
      indicator_id: '00000000-0000-0000-0000-000000000001', // dummy UUID
      code: 'TEST_NEW',
      name: 'Test New Format',
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

    const newTest = await supabase
      .from('m_kpi_sub_indicators')
      .insert(newFormatData)
      .select()

    if (newTest.error) {
      console.log('❌ New format failed:', newTest.error.message)
      console.log('🔧 This confirms the table structure issue')
    } else {
      console.log('✅ New format works')
      // Clean up
      await supabase
        .from('m_kpi_sub_indicators')
        .delete()
        .eq('code', 'TEST_NEW')
    }

    // 6. Get actual indicator for real test
    console.log('\n6. Getting real indicator for test...')
    const { data: indicators, error: indError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name')
      .limit(1)

    if (indError || !indicators || indicators.length === 0) {
      console.log('⚠️ No indicators found for real test')
    } else {
      console.log('✅ Found indicator:', indicators[0].name)
      
      // Test with real indicator ID
      const realTestData = {
        indicator_id: indicators[0].id,
        code: 'TEST_REAL',
        name: 'Test Real Indicator',
        weight_percentage: 25.5,
        target_value: 100,
        measurement_unit: '%',
        is_active: true
      }

      // Try old format first
      const realOldTest = await supabase
        .from('m_kpi_sub_indicators')
        .insert({
          ...realTestData,
          score_1: 20,
          score_2: 40,
          score_3: 60,
          score_4: 80,
          score_5: 100,
          score_1_label: 'Sangat Kurang',
          score_2_label: 'Kurang',
          score_3_label: 'Cukup',
          score_4_label: 'Baik',
          score_5_label: 'Sangat Baik'
        })
        .select()

      if (realOldTest.error) {
        console.log('❌ Real old format failed:', realOldTest.error.message)
      } else {
        console.log('✅ Real old format works')
        await supabase
          .from('m_kpi_sub_indicators')
          .delete()
          .eq('id', realOldTest.data[0].id)
      }

      // Try new format
      const realNewTest = await supabase
        .from('m_kpi_sub_indicators')
        .insert({
          ...realTestData,
          code: 'TEST_REAL2',
          scoring_criteria: [
            { score: 20, label: 'Sangat Kurang' },
            { score: 40, label: 'Kurang' },
            { score: 60, label: 'Cukup' },
            { score: 80, label: 'Baik' },
            { score: 100, label: 'Sangat Baik' }
          ]
        })
        .select()

      if (realNewTest.error) {
        console.log('❌ Real new format failed:', realNewTest.error.message)
      } else {
        console.log('✅ Real new format works')
        await supabase
          .from('m_kpi_sub_indicators')
          .delete()
          .eq('id', realNewTest.data[0].id)
      }
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE')
    console.log('=====================================')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugSubIndicatorError()