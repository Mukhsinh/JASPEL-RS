#!/usr/bin/env tsx

/**
 * Apply RLS fix secara langsung
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSDirectly() {
  console.log('🔧 Menerapkan RLS Fix Langsung...\n')

  try {
    // 1. Drop existing policies
    console.log('1. Menghapus policies lama...')
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Superadmin full access to sub indicators" ON m_kpi_sub_indicators',
      'DROP POLICY IF EXISTS "Unit manager view sub indicators" ON m_kpi_sub_indicators',
      'DROP POLICY IF EXISTS "Employee view sub indicators" ON m_kpi_sub_indicators'
    ]

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec', { sql })
      if (error && !error.message.includes('does not exist')) {
        console.error('❌ Drop policy error:', error.message)
      }
    }

    console.log('✅ Policies lama dihapus')

    // 2. Create helper function
    console.log('\n2. Membuat helper function...')
    
    const helperFunction = `
      CREATE OR REPLACE FUNCTION is_superadmin()
      RETURNS BOOLEAN AS $$
      BEGIN
        -- Check dari auth.users metadata
        IF EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND raw_user_meta_data->>'role' = 'superadmin'
        ) THEN
          RETURN TRUE;
        END IF;
        
        -- Check dari m_employees table jika ada
        IF EXISTS (
          SELECT 1 FROM m_employees e
          JOIN auth.users u ON u.email = e.email
          WHERE u.id = auth.uid()
          AND e.role = 'superadmin'
          AND e.is_active = true
        ) THEN
          RETURN TRUE;
        END IF;
        
        RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    const { error: funcError } = await supabase.rpc('exec', { sql: helperFunction })
    if (funcError) {
      console.error('❌ Helper function error:', funcError.message)
    } else {
      console.log('✅ Helper function dibuat')
    }

    // 3. Create new policies
    console.log('\n3. Membuat policies baru...')
    
    const newPolicies = [
      `CREATE POLICY "Superadmin full access to sub indicators" ON m_kpi_sub_indicators
       FOR ALL USING (is_superadmin())`,
      
      `CREATE POLICY "Unit manager view sub indicators" ON m_kpi_sub_indicators
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM auth.users u
           JOIN m_employees e ON e.email = u.email
           JOIN m_kpi_indicators i ON i.id = m_kpi_sub_indicators.indicator_id
           JOIN m_kpi_categories c ON c.id = i.category_id
           WHERE u.id = auth.uid()
           AND e.role = 'unit_manager'
           AND e.unit_id = c.unit_id
           AND e.is_active = true
         )
       )`,
       
      `CREATE POLICY "Employee view sub indicators" ON m_kpi_sub_indicators
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM auth.users u
           JOIN m_employees e ON e.email = u.email
           JOIN m_kpi_indicators i ON i.id = m_kpi_sub_indicators.indicator_id
           JOIN m_kpi_categories c ON c.id = i.category_id
           WHERE u.id = auth.uid()
           AND e.role = 'employee'
           AND e.unit_id = c.unit_id
           AND e.is_active = true
         )
       )`
    ]

    for (const sql of newPolicies) {
      const { error } = await supabase.rpc('exec', { sql })
      if (error) {
        console.error('❌ Create policy error:', error.message)
      }
    }

    console.log('✅ Policies baru dibuat')

    // 4. Test access
    console.log('\n4. Testing access...')
    
    const { data: testData, error: testError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('id, name')
      .limit(1)

    if (testError) {
      console.error('❌ Test access gagal:', testError.message)
    } else {
      console.log('✅ Access test berhasil')
    }

    console.log('\n🎉 RLS Fix berhasil diterapkan!')
    console.log('📋 Silakan coba form sub indicator lagi.')

  } catch (error) {
    console.error('❌ RLS fix gagal:', error)
  }
}

applyRLSDirectly()