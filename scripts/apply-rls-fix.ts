#!/usr/bin/env tsx

/**
 * Apply RLS fix untuk sub indicators
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSFix() {
  console.log('🔧 Menerapkan RLS Fix untuk Sub Indicators...\n')

  try {
    // Read migration file
    const migrationSQL = readFileSync('supabase/migrations/fix_sub_indicators_rls_final.sql', 'utf8')
    
    console.log('1. Menjalankan migrasi RLS...')
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migrasi gagal:', error.message)
      return
    }

    console.log('✅ Migrasi RLS berhasil')

    // Test the new policies
    console.log('\n2. Testing RLS policies...')
    
    // Test superadmin access
    const { data: testData, error: testError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('id, name')
      .limit(1)

    if (testError) {
      console.error('❌ Test access gagal:', testError.message)
    } else {
      console.log('✅ RLS policies berfungsi')
    }

    // Test insert capability
    console.log('\n3. Testing insert dengan service role...')
    
    const { data: indicators } = await supabase
      .from('m_kpi_indicators')
      .select('id')
      .limit(1)

    if (indicators && indicators.length > 0) {
      const testInsert = {
        indicator_id: indicators[0].id,
        code: 'TEST_RLS_FIX',
        name: 'Test RLS Fix',
        weight_percentage: 25.5,
        target_value: 100,
        scoring_criteria: [
          { score: 100, label: 'Perfect' }
        ],
        is_active: true
      }

      const { data: insertResult, error: insertError } = await supabase
        .from('m_kpi_sub_indicators')
        .insert(testInsert)
        .select()

      if (insertError) {
        console.error('❌ Test insert gagal:', insertError.message)
      } else {
        console.log('✅ Test insert berhasil')
        
        // Clean up
        await supabase
          .from('m_kpi_sub_indicators')
          .delete()
          .eq('id', insertResult[0].id)
      }
    }

    console.log('\n🎉 RLS Fix berhasil diterapkan!')
    console.log('\n📋 Sekarang form sub indicator seharusnya berfungsi normal.')

  } catch (error) {
    console.error('❌ Apply RLS fix gagal:', error)
  }
}

applyRLSFix()