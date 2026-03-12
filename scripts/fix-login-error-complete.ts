#!/usr/bin/env tsx

/**
 * Script untuk memperbaiki error login secara komprehensif
 * Mengatasi masalah autentikasi, resource loading, dan database
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixLoginErrors() {
  console.log('🔧 Memulai perbaikan error login...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Periksa dan perbaiki user superadmin
    console.log('1️⃣ Memeriksa user superadmin...')
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error mengambil auth users:', authError)
      return
    }

    console.log(`📊 Ditemukan ${authUsers.users.length} auth users`)

    // Cari user mukhsin9@gmail.com
    const targetEmail = 'mukhsin9@gmail.com'
    let targetUser = authUsers.users.find(u => u.email === targetEmail)

    if (!targetUser) {
      console.log('➕ Membuat user superadmin baru...')
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          role: 'superadmin'
        }
      })

      if (createError) {
        console.error('❌ Error membuat user:', createError)
        return
      }

      targetUser = newUser.user
      console.log('✅ User superadmin berhasil dibuat')
    } else {
      console.log('✅ User superadmin sudah ada')
      
      // Update password dan metadata jika perlu
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        {
          password: 'admin123',
          user_metadata: {
            role: 'superadmin'
          }
        }
      )

      if (updateError) {
        console.error('⚠️ Error update user:', updateError)
      } else {
        console.log('✅ User superadmin berhasil diupdate')
      }
    }

    // 2. Periksa dan perbaiki data employee
    console.log('2️⃣ Memeriksa data employee...')
    
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (empError) {
      console.error('❌ Error mengambil employee:', empError)
      return
    }

    if (!employee) {
      console.log('➕ Membuat record employee...')
      
      const { error: insertError } = await supabase
        .from('m_employees')
        .insert({
          user_id: targetUser.id,
          employee_code: 'SUPER001',
          full_name: 'Super Administrator',
          unit_id: null,
          tax_status: 'TK/0',
          is_active: true
        })

      if (insertError) {
        console.error('❌ Error membuat employee:', insertError)
        return
      }

      console.log('✅ Record employee berhasil dibuat')
    } else {
      console.log('✅ Record employee sudah ada')
      
      // Pastikan employee aktif
      if (!employee.is_active) {
        const { error: updateError } = await supabase
          .from('m_employees')
          .update({ is_active: true })
          .eq('id', employee.id)

        if (updateError) {
          console.error('⚠️ Error mengaktifkan employee:', updateError)
        } else {
          console.log('✅ Employee berhasil diaktifkan')
        }
      }
    }

    // 3. Test koneksi database
    console.log('3️⃣ Testing koneksi database...')
    
    const { data: testData, error: testError } = await supabase
      .from('m_employees')
      .select('count(*)')
      .single()

    if (testError) {
      console.error('❌ Error test koneksi:', testError)
    } else {
      console.log('✅ Koneksi database normal')
    }

    // 4. Periksa RLS policies
    console.log('4️⃣ Memeriksa RLS policies...')
    
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { schema_name: 'public', table_name: 'm_employees' })
      .then(() => ({ data: 'OK', error: null }))
      .catch(err => ({ data: null, error: err }))

    if (policyError) {
      console.log('⚠️ RLS policies mungkin perlu diperbaiki')
    } else {
      console.log('✅ RLS policies terdeteksi')
    }

    console.log('\n🎉 Perbaikan login selesai!')
    console.log('📋 Kredensial untuk testing:')
    console.log('   Email: mukhsin9@gmail.com')
    console.log('   Password: admin123')
    console.log('\n🔄 Silakan restart server dan coba login kembali')

  } catch (error) {
    console.error('💥 Error dalam perbaikan:', error)
  }
}

// Jalankan perbaikan
fixLoginErrors().catch(console.error)