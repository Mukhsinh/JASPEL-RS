#!/usr/bin/env tsx

/**
 * Fix Dashboard Errors
 * Memperbaiki error pada halaman dashboard
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixDashboardErrors() {
  console.log('🔧 Memperbaiki Dashboard Errors...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Verifikasi tabel t_notification ada
    console.log('1️⃣ Memeriksa tabel t_notification...')
    const { data: tables, error: tableError } = await supabase
      .from('t_notification')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('❌ Tabel t_notification tidak ditemukan atau error:', tableError.message)
      console.log('   Membuat tabel t_notification...')
      
      // Create notification table if not exists
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS t_notification (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('pool_approval', 'calculation_complete', 'password_reset', 'new_user', 'general')),
            read BOOLEAN DEFAULT FALSE,
            link TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            read_at TIMESTAMPTZ
          );

          CREATE INDEX IF NOT EXISTS idx_notification_user_id ON t_notification(user_id);
          CREATE INDEX IF NOT EXISTS idx_notification_read ON t_notification(read);
          CREATE INDEX IF NOT EXISTS idx_notification_created_at ON t_notification(created_at DESC);

          -- RLS Policies
          ALTER TABLE t_notification ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Users can view own notifications" ON t_notification;
          CREATE POLICY "Users can view own notifications" ON t_notification
            FOR SELECT USING (auth.uid() = user_id);

          DROP POLICY IF EXISTS "Users can update own notifications" ON t_notification;
          CREATE POLICY "Users can update own notifications" ON t_notification
            FOR UPDATE USING (auth.uid() = user_id);
        `
      })

      if (createError) {
        console.error('❌ Gagal membuat tabel:', createError.message)
      } else {
        console.log('✅ Tabel t_notification berhasil dibuat')
      }
    } else {
      console.log('✅ Tabel t_notification sudah ada')
    }

    // 2. Verifikasi m_employees memiliki relasi yang benar
    console.log('\n2️⃣ Memeriksa struktur m_employees...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, m_units!m_employees_unit_id_fkey(name)')
      .limit(1)

    if (empError) {
      console.error('❌ Error query m_employees:', empError.message)
    } else {
      console.log('✅ Struktur m_employees sudah benar')
    }

    // 3. Test notification API
    console.log('\n3️⃣ Testing notification service...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️  Tidak ada user untuk test')
    } else {
      const testUser = users[0]
      console.log(`   Testing dengan user: ${testUser.email}`)
      
      const { count, error: countError } = await supabase
        .from('t_notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUser.id)
        .eq('read', false)

      if (countError) {
        console.error('❌ Error counting notifications:', countError.message)
      } else {
        console.log(`✅ Notification count berhasil: ${count || 0} unread`)
      }
    }

    console.log('\n✅ Semua perbaikan selesai!')
    console.log('\n📋 Langkah selanjutnya:')
    console.log('   1. Hapus folder .next: rmdir /s /q .next')
    console.log('   2. Restart dev server: npm run dev')
    console.log('   3. Clear browser cache (Ctrl+Shift+Delete)')
    console.log('   4. Reload halaman dashboard')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

fixDashboardErrors()
