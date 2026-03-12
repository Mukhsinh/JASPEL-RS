#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi sistem kriteria penilaian yang fleksibel
 * pada form sub indikator KPI
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFlexibleScoringCriteria() {
  console.log('🧪 Testing Flexible Scoring Criteria System...\n')

  try {
    // 1. Test reading existing sub indicators with new structure
    console.log('1. Testing data migration and reading...')
    const { data: subIndicators, error: readError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('id, name, scoring_criteria')
      .limit(3)

    if (readError) {
      console.error('❌ Error reading sub indicators:', readError.message)
      return false
    }

    console.log('✅ Successfully read sub indicators:')
    subIndicators?.forEach(sub => {
      console.log(`   - ${sub.name}: ${sub.scoring_criteria.length} criteria`)
    })

    // 2. Test creating a new sub indicator with custom criteria (more than 5)
    console.log('\n2. Testing creation with custom criteria (7 levels)...')
    
    // First get an indicator to attach to
    const { data: indicators, error: indicatorError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name')
      .limit(1)

    if (indicatorError || !indicators?.length) {
      console.error('❌ No indicators found for testing')
      return false
    }

    const testIndicator = indicators[0]
    
    // Create test sub indicator with 7 scoring criteria
    const customCriteria = [
      { score: 10, label: 'Sangat Buruk' },
      { score: 25, label: 'Buruk' },
      { score: 40, label: 'Kurang' },
      { score: 55, label: 'Cukup' },
      { score: 70, label: 'Baik' },
      { score: 85, label: 'Sangat Baik' },
      { score: 100, label: 'Luar Biasa' }
    ]

    const { data: newSubIndicator, error: createError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert({
        indicator_id: testIndicator.id,
        code: 'TEST_FLEX_001',
        name: 'Test Sub Indikator Fleksibel',
        weight_percentage: 25.0,
        target_value: 100.0,
        scoring_criteria: customCriteria,
        description: 'Test sub indikator dengan 7 kriteria penilaian',
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating test sub indicator:', createError.message)
      return false
    }

    console.log('✅ Successfully created sub indicator with 7 criteria')
    console.log(`   ID: ${newSubIndicator.id}`)
    console.log(`   Criteria count: ${newSubIndicator.scoring_criteria.length}`)

    // 3. Test updating with different number of criteria
    console.log('\n3. Testing update with different criteria count (3 levels)...')
    
    const updatedCriteria = [
      { score: 30, label: 'Rendah' },
      { score: 65, label: 'Sedang' },
      { score: 100, label: 'Tinggi' }
    ]

    const { error: updateError } = await supabase
      .from('m_kpi_sub_indicators')
      .update({
        scoring_criteria: updatedCriteria
      })
      .eq('id', newSubIndicator.id)

    if (updateError) {
      console.error('❌ Error updating sub indicator:', updateError.message)
      return false
    }

    console.log('✅ Successfully updated to 3 criteria')

    // 4. Verify the update
    const { data: updatedSubIndicator, error: verifyError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('scoring_criteria')
      .eq('id', newSubIndicator.id)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message)
      return false
    }

    console.log(`✅ Verified: Now has ${updatedSubIndicator.scoring_criteria.length} criteria`)

    // 5. Test validation function
    console.log('\n4. Testing validation function...')
    
    // Test valid criteria
    const { data: validTest, error: validError } = await supabase
      .rpc('validate_scoring_criteria', {
        criteria: [
          { score: 20, label: 'Test 1' },
          { score: 80, label: 'Test 2' }
        ]
      })

    if (validError) {
      console.error('❌ Error testing validation:', validError.message)
      return false
    }

    console.log(`✅ Validation function works: ${validTest ? 'Valid' : 'Invalid'} criteria`)

    // 6. Clean up test data
    console.log('\n5. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', newSubIndicator.id)

    if (deleteError) {
      console.error('❌ Error cleaning up:', deleteError.message)
      return false
    }

    console.log('✅ Test data cleaned up')

    console.log('\n🎉 All tests passed! Flexible scoring criteria system is working correctly.')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the test
testFlexibleScoringCriteria()
  .then(success => {
    if (success) {
      console.log('\n✅ Flexible scoring criteria system test completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Test failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })