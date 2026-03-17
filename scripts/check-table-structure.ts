import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkTableStructure() {
  console.log('🔍 Memeriksa struktur tabel...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Check t_kpi_assessments columns
    console.log('📋 Kolom di t_kpi_assessments:')
    const { data: assessments, error } = await supabase
      .from('t_kpi_assessments')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error:', error.message)
    } else if (assessments && assessments.length > 0) {
      console.log('Kolom yang tersedia:', Object.keys(assessments[0]))
    } else {
      console.log('⚠️ Tabel kosong, cek dengan query SQL...')
    }

    // Check if t_audit_logs exists
    console.log('\n📋 Memeriksa t_audit_logs:')
    const { data: audits, error: auditError } = await supabase
      .from('t_audit_logs')
      .select('*')
      .limit(1)
    
    if (auditError) {
      console.error('❌ Tabel tidak ada:', auditError.message)
    } else {
      console.log('✅ Tabel ada')
      if (audits && audits.length > 0) {
        console.log('Kolom:', Object.keys(audits[0]))
      }
    }

    // List all tables
    console.log('\n📋 Daftar semua tabel:')
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables')
    
    if (tablesError) {
      console.log('⚠️ Tidak bisa query daftar tabel, coba manual...')
      
      // Try common tables
      const tablesToCheck = [
        't_kpi_assessments',
        't_audit_logs', 
        't_audit',
        'audit_logs',
        'm_employees',
        'm_units'
      ]
      
      for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(1)
        if (!error) {
          console.log(`✅ ${table}`)
        }
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
  }
}

checkTableStructure()
