#!/usr/bin/env tsx

/**
 * Simple test untuk form sub indicator
 * Test apakah RLS error sudah teratasi
 */

import { createClient } from '@/lib/supabase/server'

async function testSubIndicatorForm() {
  console.log('🧪 Testing Sub Indicator Form...')
  
  try {
    const supabase = createClient()
    
    // Test 1: Check if we can read existing sub indicators
    console.log('\n1️⃣ Testing read access...')
    const { data: subIndicators, error: readError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('id, code, name, indicator_id')
      .limit(5)
    
    if (readError) {
      console.error('❌ Read error:', readError.message)
    } else {
      console.log(`✅ Successfully read ${subIndicators?.length || 0} sub indicators`)
    }
    
    // Test 2: Check if we can read indicators for form
    console.log('\n2️⃣ Testing indicator access...')
    const { data: indicators, error: indicatorError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name, category_id')
      .limit(3)
    
    if (indicatorError) {
      console.error('❌ Indicator error:', indicatorError.message)
    } else {
      console.log(`✅ Successfully read ${indicators?.length || 0} indicators`)
    }
    
    // Test 3: Check RLS functions
    console.log('\n3️⃣ Testing RLS functions...')
    const { data: isSuperadmin, error: superadminError } = await supabase
      .rpc('is_superadmin')
    
    if (superadminError) {
      console.error('❌ Superadmin check error:', superadminError.message)
    } else {
      console.log(`✅ is_superadmin(): ${isSuperadmin}`)
    }
    
    console.log('\n🎉 Test selesai!')
    console.log('📋 Status:')
    console.log(`  - Read sub indicators: ${readError ? '❌' : '✅'}`)
    console.log(`  - Read indicators: ${indicatorError ? '❌' : '✅'}`)
    console.log(`  - RLS functions: ${superadminError ? '❌' : '✅'}`)
    
    if (!readError && !indicatorError && !superadminError) {
      console.log('\n💡 RLS sudah diperbaiki! Form sub indicator seharusnya bisa berfungsi.')
    } else {
      console.log('\n⚠️  Masih ada masalah yang perlu diperbaiki.')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testSubIndicatorForm()