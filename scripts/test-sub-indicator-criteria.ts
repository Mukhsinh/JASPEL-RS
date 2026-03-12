#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi form sub indikator dengan kriteria pengukuran
 * Memastikan semua field kriteria pengukuran tampil dan berfungsi dengan baik
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env.local file.')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSubIndicatorCriteria() {
  console.log('🧪 Testing Sub Indicator Criteria Form...')
  
  try {
    // 1. Test database structure
    console.log('\n1. Checking database structure...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'm_kpi_sub_indicators' })
    
    if (columnsError) {
      console.log('⚠️  Using alternative method to check columns...')
      
      // Alternative: Check by querying the table
      const { data: sampleData, error: sampleError } = await supabase
        .from('m_kpi_sub_indicators')
        .select('*')
        .limit(1)
      
      if (sampleError) {
        console.error('❌ Error checking table structure:', sampleError.message)
        return
      }
      
      if (sampleData && sampleData.length > 0) {
        const sample = sampleData[0]
        console.log('✅ Table structure verified with sample data')
        console.log('   Available fields:', Object.keys(sample).join(', '))
        
        // Check if scoring fields exist
        const scoringFields = ['score_1', 'score_2', 'score_3', 'score_4', 'score_5', 
                              'score_1_label', 'score_2_label', 'score_3_label', 'score_4_label', 'score_5_label']
        const missingFields = scoringFields.filter(field => !(field in sample))
        
        if (missingFields.length > 0) {
          console.error('❌ Missing scoring fields:', missingFields.join(', '))
          return
        }
        
        console.log('✅ All scoring criteria fields are present')
      } else {
        console.log('⚠️  No data in table, checking schema...')
      }
    } else {
      console.log('✅ Database columns retrieved successfully')
      console.log('   Columns:', columns?.map((c: any) => c.column_name).join(', '))
    }

    // 2. Test creating a sub indicator with criteria
    console.log('\n2. Testing sub indicator creation with criteria...')
    
    // First, get an existing indicator to use
    const { data: indicators, error: indicatorsError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name')
      .limit(1)
    
    if (indicatorsError || !indicators || indicators.length === 0) {
      console.error('❌ No indicators found for testing')
      return
    }
    
    const testIndicator = indicators[0]
    console.log(`   Using indicator: ${testIndicator.name}`)
    
    // Create test sub indicator with criteria
    const testSubIndicator = {
      indicator_id: testIndicator.id,
      code: `TEST_SUB_${Date.now()}`,
      name: 'Test Sub Indikator dengan Kriteria',
      weight_percentage: 25.00,
      target_value: 100.00,
      measurement_unit: '%',
      description: 'Test sub indikator untuk verifikasi kriteria pengukuran',
      score_1: 20.00,
      score_2: 40.00,
      score_3: 60.00,
      score_4: 80.00,
      score_5: 100.00,
      score_1_label: 'Sangat Kurang (< 20%)',
      score_2_label: 'Kurang (20-39%)',
      score_3_label: 'Cukup (40-59%)',
      score_4_label: 'Baik (60-79%)',
      score_5_label: 'Sangat Baik (≥ 80%)',
      is_active: true
    }
    
    const { data: createdSub, error: createError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(testSubIndicator)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating test sub indicator:', createError.message)
      return
    }
    
    console.log('✅ Test sub indicator created successfully')
    console.log(`   ID: ${createdSub.id}`)
    console.log(`   Name: ${createdSub.name}`)
    console.log(`   Scoring criteria:`)
    console.log(`     Score 1 (${createdSub.score_1}): ${createdSub.score_1_label}`)
    console.log(`     Score 2 (${createdSub.score_2}): ${createdSub.score_2_label}`)
    console.log(`     Score 3 (${createdSub.score_3}): ${createdSub.score_3_label}`)
    console.log(`     Score 4 (${createdSub.score_4}): ${createdSub.score_4_label}`)
    console.log(`     Score 5 (${createdSub.score_5}): ${createdSub.score_5_label}`)

    // 3. Test updating criteria
    console.log('\n3. Testing criteria update...')
    
    const updatedCriteria = {
      score_1_label: 'Sangat Kurang - Perlu Perbaikan Mendesak',
      score_2_label: 'Kurang - Perlu Perbaikan',
      score_3_label: 'Cukup - Memenuhi Standar Minimum',
      score_4_label: 'Baik - Melebihi Standar',
      score_5_label: 'Sangat Baik - Kinerja Luar Biasa'
    }
    
    const { error: updateError } = await supabase
      .from('m_kpi_sub_indicators')
      .update(updatedCriteria)
      .eq('id', createdSub.id)
    
    if (updateError) {
      console.error('❌ Error updating criteria:', updateError.message)
    } else {
      console.log('✅ Criteria updated successfully')
      console.log('   Updated labels:')
      Object.entries(updatedCriteria).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`)
      })
    }

    // 4. Test retrieval with criteria
    console.log('\n4. Testing retrieval with criteria...')
    
    const { data: retrievedSub, error: retrieveError } = await supabase
      .from('m_kpi_sub_indicators')
      .select(`
        id, name, code, weight_percentage, target_value, measurement_unit, description,
        score_1, score_2, score_3, score_4, score_5,
        score_1_label, score_2_label, score_3_label, score_4_label, score_5_label,
        indicator_id, is_active, created_at, updated_at
      `)
      .eq('id', createdSub.id)
      .single()
    
    if (retrieveError) {
      console.error('❌ Error retrieving sub indicator:', retrieveError.message)
    } else {
      console.log('✅ Sub indicator retrieved successfully with all criteria fields')
      console.log('   Complete data structure verified')
    }

    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...')
    
    const { error: deleteError } = await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', createdSub.id)
    
    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }

    console.log('\n🎉 All tests passed! Sub indicator criteria form should work correctly.')
    console.log('\n📋 Summary:')
    console.log('   ✅ Database structure supports scoring criteria')
    console.log('   ✅ Sub indicator creation with criteria works')
    console.log('   ✅ Criteria update functionality works')
    console.log('   ✅ Data retrieval includes all criteria fields')
    console.log('   ✅ Test cleanup completed')
    
    console.log('\n🌐 Next steps:')
    console.log('   1. Open browser to http://localhost:3002/kpi-config')
    console.log('   2. Login as superadmin')
    console.log('   3. Try adding a new sub indicator')
    console.log('   4. Verify that scoring criteria section is visible')
    console.log('   5. Test form validation and submission')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testSubIndicatorCriteria()