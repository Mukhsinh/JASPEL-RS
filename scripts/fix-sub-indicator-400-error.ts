#!/usr/bin/env tsx

/**
 * Fix error 400 pada sub indicator form dengan service role key
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSubIndicator400Error() {
  console.log('🔧 Memperbaiki Error 400 Sub-Indicator...\n')

  try {
    // 1. Periksa RLS policies yang mungkin bermasalah
    console.log('1. Memeriksa RLS policies...')
    
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'm_kpi_sub_indicators' })
      .catch(() => ({ data: null, error: null }))

    if (policies) {
      console.log('📋 RLS policies aktif:', policies.length)
    }

    // 2. Test dengan service role (bypass RLS)
    console.log('\n2. Testing dengan service role...')
    
    const { data: indicators } = await supabase
      .from('m_kpi_indicators')
      .select('id, name')
      .limit(1)

    if (!indicators || indicators.length === 0) {
      console.log('⚠️ Tidak ada indikator untuk testing')
      return
    }

    const indicator = indicators[0]
    console.log('✅ Menggunakan indikator:', indicator.name)

    // 3. Test insert dengan data yang sama persis seperti form
    const testData = {
      indicator_id: indicator.id,
      code: 'SUB_TEST_FIX',
      name: 'Test Fix Error 400',
      description: 'Test untuk memperbaiki error 400',
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

    console.log('\n3. Testing insert dengan service role...')
    const { data: insertResult, error: insertError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(testData)
      .select()

    if (insertError) {
      console.error('❌ Insert gagal dengan service role:', insertError)
      
      // Analisis error lebih detail
      if (insertError.code === '23514') {
        console.log('🔍 Check constraint violation - memeriksa constraint...')
        
        // Test constraint secara manual
        const { data: constraintTest } = await supabase
          .rpc('validate_scoring_criteria', { criteria: testData.scoring_criteria })
          .catch(() => ({ data: false }))
        
        console.log('📋 Constraint validation result:', constraintTest)
      }
      
      return
    }

    console.log('✅ Insert berhasil dengan service role')
    const createdId = insertResult[0].id

    // 4. Sekarang test dengan anon key (seperti form)
    console.log('\n4. Testing dengan anon key...')
    
    const anonSupabase = createClient(
      supabaseUrl, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Simulate auth session
    const { data: authData, error: authError } = await anonSupabase.auth.getSession()
    console.log('📋 Auth session:', authData.session ? 'Ada' : 'Tidak ada')

    // Test insert dengan anon key
    const anonTestData = {
      ...testData,
      code: 'SUB_TEST_ANON'
    }

    const { data: anonResult, error: anonError } = await anonSupabase
      .from('m_kpi_sub_indicators')
      .insert(anonTestData)
      .select()

    if (anonError) {
      console.error('❌ Insert gagal dengan anon key:', anonError.message)
      console.error('❌ Error code:', anonError.code)
      
      if (anonError.code === '42501') {
        console.log('🔍 Permission denied - RLS policy issue')
        console.log('🔧 Perlu perbaikan RLS policy untuk superadmin')
      }
    } else {
      console.log('✅ Insert berhasil dengan anon key')
      await anonSupabase
        .from('m_kpi_sub_indicators')
        .delete()
        .eq('id', anonResult[0].id)
    }

    // 5. Clean up
    await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', createdId)

    console.log('\n🎯 DIAGNOSIS SELESAI')
    console.log('=====================================')

  } catch (error) {
    console.error('❌ Fix gagal:', error)
  }
}

fixSubIndicator400Error()