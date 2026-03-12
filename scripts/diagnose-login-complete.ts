#!/usr/bin/env tsx

/**
 * Diagnosa lengkap masalah login
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function diagnoseLogin() {
  console.log('🔍 DIAGNOSA LOGIN LENGKAP')
  console.log('========================')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  console.log('\n1️⃣ Environment Variables:')
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Environment variables tidak lengkap!')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test koneksi database
    console.log('\n2️⃣ Test Koneksi Database:')
    const { data: testData, error: testError } = await supabase
      .from('m_employees')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Koneksi database gagal:', testError.message)
    } else {
      console.log('✅ Koneksi database berhasil')
    }

    // Periksa auth users
    console.log('\n3️⃣ Auth Users:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Error mengambil auth users:', authError.message)
    } else {
      console.log(`📊 Total auth users: ${authUsers.users.length}`)
      
      const targetUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
      if (targetUser) {
        console.log('✅ User mukhsin9@gmail.com ditemukan')
        console.log('   ID:', targetUser.id)
        console.log('   Role:', targetUser.user_metadata?.role || 'Tidak ada')
        console.log('   Email Confirmed:', targetUser.email_confirmed_at ? '✅' : '❌')
      } else {
        console.log('❌ User mukhsin9@gmail.com tidak ditemukan')
      }
    }

    // Periksa employees
    console.log('\n4️⃣ Employee Records:')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('id, user_id, full_name, is_active')
      .limit(10)

    if (empError) {
      console.log('❌ Error mengambil employees:', empError.message)
    } else {
      console.log(`📊 Total employees: ${employees.length}`)
      
      const targetEmployee = employees.find(e => 
        authUsers.users.some(u => u.email === 'mukhsin9@gmail.com' && u.id === e.user_id)
      )
      
      if (targetEmployee) {
        console.log('✅ Employee record ditemukan')
        console.log('   Name:', targetEmployee.full_name)
        console.log('   Active:', targetEmployee.is_active ? '✅' : '❌')
      } else {
        console.log('❌ Employee record tidak ditemukan')
      }
    }

    // Test login simulation
    console.log('\n5️⃣ Test Login Simulation:')
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'mukhsin9@gmail.com',
        password: 'admin123'
      })

      if (loginError) {
        console.log('❌ Login gagal:', loginError.message)
      } else {
        console.log('✅ Login berhasil')
        console.log('   User ID:', loginData.user?.id)
        console.log('   Email:', loginData.user?.email)
        
        // Sign out immediately
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.log('❌ Exception during login:', error)
    }

    // Test server status
    console.log('\n6️⃣ Server Status:')
    try {
      const response = await fetch('http://localhost:3002/api/health', {
        method: 'GET'
      }).catch(() => null)

      if (response && response.ok) {
        console.log('✅ Server API responding')
      } else {
        console.log('⚠️ Server API tidak merespons (normal jika tidak ada endpoint /api/health)')
      }
    } catch (error) {
      console.log('⚠️ Server check error:', error)
    }

    console.log('\n🎯 KESIMPULAN:')
    console.log('1. Pastikan server berjalan di http://localhost:3002')
    console.log('2. Buka browser dan akses http://localhost:3002/login')
    console.log('3. Gunakan kredensial: mukhsin9@gmail.com / admin123')
    console.log('4. Periksa console browser untuk error detail')

  } catch (error) {
    console.error('💥 Error dalam diagnosa:', error)
  }
}

diagnoseLogin().catch(console.error)