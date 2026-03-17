import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://omlbijupllrglmebbqnn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbGJpanVwbGxyZ2xtZWJicW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTIxMTEsImV4cCI6MjA4ODI2ODExMX0.rHTlmURvcVQh2WdMsGnEe0zTytY76iKwHAcx1iJudd8'

async function fixLoginRedirect() {
  console.log('=== PERBAIKAN LOGIN REDIRECT ===\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Test login dengan kredensial yang sama
    console.log('1. Testing login dengan mukhsin9@gmail.com...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (loginError) {
      console.log('❌ Login gagal:', loginError.message)
      return
    }

    console.log('✅ Login berhasil')
    console.log('User ID:', loginData.user?.id)
    console.log('Email:', loginData.user?.email)
    console.log('Role dari metadata:', loginData.user?.user_metadata?.role)

    // 2. Cek data employee
    console.log('\n2. Memeriksa data employee...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single()

    if (empError) {
      console.log('❌ Error mengambil data employee:', empError.message)
      
      // Cek apakah user ada di tabel auth.users tapi tidak ada di m_employees
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser.user) {
        console.log('User ada di auth tapi tidak ada employee record')
        console.log('Kemungkinan penyebab: data employee belum dibuat atau user_id tidak match')
      }
      return
    }

    console.log('✅ Data employee ditemukan:')
    console.log('- ID:', employee.id)
    console.log('- Nama:', employee.full_name)
    console.log('- Unit ID:', employee.unit_id)
    console.log('- Active:', employee.is_active)
    console.log('- User ID:', employee.user_id)

    if (!employee.is_active) {
      console.log('❌ Employee tidak aktif')
      return
    }

    // 3. Cek role di user_metadata
    console.log('\n3. Memeriksa role di user_metadata...')
    const role = loginData.user?.user_metadata?.role
    
    if (!role) {
      console.log('❌ Role tidak ditemukan di user_metadata')
      console.log('Metadata lengkap:', JSON.stringify(loginData.user?.user_metadata, null, 2))
      
      // Perbaiki dengan menambahkan role ke metadata
      console.log('\n🔧 Memperbaiki role di user_metadata...')
      
      // Tentukan role berdasarkan email atau data lain
      let userRole = 'employee' // default
      if (employee.full_name?.toLowerCase().includes('admin') || 
          loginData.user?.email === 'mukhsin9@gmail.com') {
        userRole = 'superadmin'
      }
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: userRole }
      })
      
      if (updateError) {
        console.log('❌ Gagal update role:', updateError.message)
      } else {
        console.log('✅ Role berhasil diupdate ke:', userRole)
      }
    } else {
      console.log('✅ Role ditemukan:', role)
    }

    // 4. Test akses ke dashboard
    console.log('\n4. Testing akses dashboard...')
    
    // Simulasi middleware check
    const session = await supabase.auth.getSession()
    if (session.data.session) {
      console.log('✅ Session tersedia')
      console.log('Session user ID:', session.data.session.user.id)
      console.log('Session role:', session.data.session.user.user_metadata?.role)
      
      // Cek apakah middleware akan mengizinkan akses
      const userRole = session.data.session.user.user_metadata?.role
      if (userRole && employee.is_active) {
        console.log('✅ Middleware seharusnya mengizinkan akses ke dashboard')
      } else {
        console.log('❌ Middleware akan redirect karena:')
        if (!userRole) console.log('  - Role tidak ada')
        if (!employee.is_active) console.log('  - Employee tidak aktif')
      }
    } else {
      console.log('❌ Session tidak tersedia')
    }

    // 5. Rekomendasi perbaikan
    console.log('\n=== REKOMENDASI PERBAIKAN ===')
    
    if (!role) {
      console.log('1. ✅ Role sudah diperbaiki - user perlu login ulang')
    }
    
    console.log('2. Pastikan cookies dapat disimpan dengan benar')
    console.log('3. Periksa middleware.ts untuk memastikan logika redirect benar')
    console.log('4. Coba clear browser cache dan cookies')
    
    console.log('\n=== LANGKAH SELANJUTNYA ===')
    console.log('1. Refresh halaman login')
    console.log('2. Login ulang dengan kredensial yang sama')
    console.log('3. Jika masih redirect, periksa browser developer tools untuk error')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    // Sign out untuk cleanup
    await supabase.auth.signOut()
  }
}

fixLoginRedirect()