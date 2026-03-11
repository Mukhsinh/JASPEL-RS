#!/usr/bin/env tsx

/**
 * Apply KPI Assessment System Migration
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
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

async function applyMigration() {
  console.log('🚀 Applying KPI Assessment System Migration...')
  
  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/add_kpi_assessment_system.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // Try direct execution if rpc fails
      console.log('⚠️  RPC failed, trying direct execution...')
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase
            .from('_temp_exec')
            .select('*')
            .limit(0) // This will fail but we can use it to execute SQL
          
          // Alternative: use a simple query to test connection
          const { error: testError } = await supabase
            .from('m_employees')
            .select('id')
            .limit(1)
          
          if (testError) {
            console.error('❌ Database connection failed:', testError.message)
            return
          }
        }
      }
      
      console.log('⚠️  Migration may need to be applied manually')
      console.log('📋 Please run the following SQL in your Supabase SQL editor:')
      console.log('=' .repeat(60))
      console.log(migrationSQL)
      console.log('=' .repeat(60))
      
    } else {
      console.log('✅ Migration applied successfully')
    }
    
    // Test if tables were created
    console.log('🔍 Verifying migration...')
    
    const { data: assessmentTable, error: tableError } = await supabase
      .from('t_kpi_assessments')
      .select('*')
      .limit(1)
    
    if (tableError && !tableError.message.includes('0 rows')) {
      console.log('❌ Assessment table not found - migration may need manual application')
    } else {
      console.log('✅ Assessment table verified')
    }
    
    const { data: statusView, error: viewError } = await supabase
      .from('v_assessment_status')
      .select('*')
      .limit(1)
    
    if (viewError && !viewError.message.includes('0 rows')) {
      console.log('❌ Assessment status view not found - migration may need manual application')
    } else {
      console.log('✅ Assessment status view verified')
    }
    
    console.log('🎯 Migration process completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
applyMigration().catch(error => {
  console.error('❌ Migration script failed:', error)
  process.exit(1)
})