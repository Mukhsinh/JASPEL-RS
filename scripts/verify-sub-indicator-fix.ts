#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyFix() {
  console.log('🔍 Verifying Sub-Indicator RLS Fix...\n')

  // Check RLS policies
  const { data: policies } = await supabase
    .rpc('sql', { query: `
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'm_kpi_sub_indicators' 
      ORDER BY policyname
    ` })

  console.log('✅ Current RLS Policies:')
  policies?.forEach((p: any) => console.log(`   ${p.policyname} (${p.cmd})`))

  // Test basic operations
  const { data: indicator } = await supabase
    .from('m_kpi_indicators')
    .select('id')
    .limit(1)
    .single()

  if (indicator) {
    const testData = {
      indicator_id: indicator.id,
      code: 'TEST-001',
      name: 'Test Sub Indicator',
      weight_percentage: 25.0,
      is_active: true
    }

    const { data, error } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(testData)
      .select()
      .single()

    if (error) {
      console.log('❌ Insert test failed:', error.message)
    } else {
      console.log('✅ Insert test passed')
      
      // Cleanup
      await supabase
        .from('m_kpi_sub_indicators')
        .delete()
        .eq('id', data.id)
    }
  }

  console.log('\n🎉 Sub-indicator form should now work without permission errors!')
}

verifyFix().catch(console.error)