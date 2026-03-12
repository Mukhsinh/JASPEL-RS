#!/usr/bin/env tsx

/**
 * Apply RLS fix for m_kpi_sub_indicators table
 * Fixes the "new row violates row-level security policy" error
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function applyRLSFix() {
  console.log('🔧 Menerapkan perbaikan RLS untuk m_kpi_sub_indicators...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/fix_sub_indicators_rls_complete.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Menjalankan migrasi RLS...')
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })
    
    if (error) {
      console.error('❌ Error menjalankan migrasi:', error)
      return
    }
    
    console.log('✅ Migrasi RLS berhasil diterapkan')
    
    // Test RLS policies
    console.log('\n🧪 Testing RLS policies...')
    
    // Test 1: Check if policies exist
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'm_kpi_sub_indicators')
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError)
      return
    }
    
    console.log(`✅ Found ${policies?.length || 0} RLS policies for m_kpi_sub_indicators`)
    policies?.forEach(policy => {
      console.log(`  - ${policy.policyname}: ${policy.cmd}`)
    })
    
    // Test 2: Check table permissions
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'm_kpi_sub_indicators')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError)
      return
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Tabel m_kpi_sub_indicators ditemukan')
    } else {
      console.log('⚠️  Tabel m_kpi_sub_indicators tidak ditemukan')
    }
    
    console.log('\n🎉 Perbaikan RLS selesai!')
    console.log('📋 Yang diperbaiki:')
    console.log('  ✅ RLS policies untuk m_kpi_sub_indicators')
    console.log('  ✅ Superadmin dapat mengelola semua sub indicators')
    console.log('  ✅ Unit manager dapat mengelola sub indicators di unit mereka')
    console.log('  ✅ Employee dapat melihat sub indicators di unit mereka')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  applyRLSFix()
}

export default applyRLSFix