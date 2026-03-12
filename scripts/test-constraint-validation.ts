#!/usr/bin/env tsx

/**
 * Test constraint validation untuk scoring criteria
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConstraintValidation() {
  console.log('🧪 Testing Constraint Validation...\n')

  try {
    // 1. Test the validation function directly
    console.log('1. Testing validation function...')
    
    const testCriteria = [
      { score: 20, label: 'Sangat Kurang' },
      { score: 40, label: 'Kurang' },
      { score: 60, label: 'Cukup' },
      { score: 80, label: 'Baik' },
      { score: 100, label: 'Sangat Baik' }
    ]

    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_scoring_criteria', { criteria: testCriteria })

    if (validationError) {
      console.error('❌ Validation function error:', validationError)
    } else {
      console.log('✅ Validation result:', validationResult)
    }

    // 2. Test different formats
    console.log('\n2. Testing different formats...')
    
    // Test with string (should fail)
    const { data: stringTest, error: stringError } = await supabase
      .rpc('validate_scoring_criteria', { criteria: JSON.stringify(testCriteria) })

    if (stringError) {
      console.log('❌ String format failed (expected):', stringError.message)
    } else {
      console.log('⚠️ String format passed (unexpected):', stringTest)
    }

    // Test with empty array (should fail)
    const { data: emptyTest, error: emptyError } = await supabase
      .rpc('validate_scoring_criteria', { criteria: [] })

    if (emptyError) {
      console.log('❌ Empty array failed (expected):', emptyError.message)
    } else {
      console.log('⚠️ Empty array result:', emptyTest)
    }

    // Test with invalid structure (should fail)
    const invalidCriteria = [
      { score: 'invalid', label: 'Test' }
    ]

    const { data: invalidTest, error: invalidError } = await supabase
      .rpc('validate_scoring_criteria', { criteria: invalidCriteria })

    if (invalidError) {
      console.log('❌ Invalid structure failed (expected):', invalidError.message)
    } else {
      console.log('⚠️ Invalid structure result:', invalidTest)
    }

    // 3. Test actual insert with problematic data
    console.log('\n3. Testing actual insert scenarios...')
    
    // Get indicator
    const { data: indicators } = await supabase
      .from('m_kpi_indicators')
      .select('id')
      .limit(1)

    if (!indicators || indicators.length === 0) {
      console.log('⚠️ No indicators for testing')
      return
    }

    const indicatorId = indicators[0].id

    // Test 1: Valid data
    console.log('\n3a. Testing valid data...')
    const validData = {
      indicator_id: indicatorId,
      code: 'TEST_VALID',
      name: 'Test Valid',
      weight_percentage: 25.5,
      target_value: 100,
      scoring_criteria: testCriteria,
      is_active: true
    }

    const { data: validInsert, error: validInsertError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(validData)
      .select()

    if (validInsertError) {
      console.error('❌ Valid insert failed:', validInsertError)
      console.error('❌ Error code:', validInsertError.code)
      console.error('❌ Error details:', validInsertError.details)
    } else {
      console.log('✅ Valid insert successful')
      
      // Clean up
      await supabase
        .from('m_kpi_sub_indicators')
        .delete()
        .eq('id', validInsert[0].id)
    }

    // Test 2: Invalid scoring criteria format
    console.log('\n3b. Testing invalid scoring criteria...')
    const invalidData = {
      indicator_id: indicatorId,
      code: 'TEST_INVALID',
      name: 'Test Invalid',
      weight_percentage: 25.5,
      target_value: 100,
      scoring_criteria: 'invalid_string',
      is_active: true
    }

    const { data: invalidInsert, error: invalidInsertError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(invalidData)
      .select()

    if (invalidInsertError) {
      console.log('✅ Invalid insert failed (expected):', invalidInsertError.message)
      console.log('📋 Error code:', invalidInsertError.code)
    } else {
      console.log('⚠️ Invalid insert succeeded (unexpected)')
      await supabase
        .from('m_kpi_sub_indicators')
        .delete()
        .eq('id', invalidInsert[0].id)
    }

    console.log('\n🎯 Constraint validation test complete')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testConstraintValidation()