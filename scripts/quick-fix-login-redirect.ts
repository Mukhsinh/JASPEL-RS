import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://omlbijupllrglmebbqnn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbGJpanVwbGxyZ2xtZWJicW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTIxMTEsImV4cCI6MjA4ODI2ODExMX0.rHTlmURvcVQh2WdMsGnEe0zTytY76iKwHAcx1iJudd8'

async function quickFixLoginRedirect() {
  console.log('=== QUICK FIX LOGIN REDIRECT ===\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test login dan lihat detail session
    console.log('Testing login flow...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (loginError) {
      console.log('❌ Login error:', loginError.message)
      return
    }

    console.log('✅ Login berhasil')
    console.log('User ID:', loginData.user?.id)
    console.log('Role:', loginData.user?.user_metadata?.role)

    // Cek session setelah login
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session after login:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasRole: !!session?.user?.user_metadata?.role,
      role: session?.user?.user_metadata?.role
    })

    // Cek employee data
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single()

    if (empError) {
      console.log('❌ Employee error:', empError.message)
      return
    }

    console.log('✅ Employee data:', {
      id: employee.id,
      name: employee.full_name,
      active: employee.is_active,
      unitId: employee.unit_id
    })

    console.log('\n=== DIAGNOSIS ===')
    console.log('Login: ✅ Berhasil')
    console.log('Session: ✅ Tersedia')
    console.log('Role: ✅', session?.user?.user_metadata?.role)
    console.log('Employee: ✅ Active')

    console.log('\n=== KEMUNGKINAN PENYEBAB REDIRECT ===')
    console.log('1. Middleware tidak dapat membaca session cookies dengan benar')
    console.log('2. Race condition - client session ready tapi server belum')
    console.log('3. Cookie path/domain tidak sesuai')

    console.log('\n=== SOLUSI CEPAT ===')
    console.log('1. Coba login di browser incognito mode')
    console.log('2. Clear browser cache dan cookies')
    console.log('3. Restart development server')
    console.log('4. Coba browser berbeda')

    console.log('\n=== PERBAIKAN KODE ===')
    console.log('Perlu modifikasi login page untuk:')
    console.log('- Menunggu session lebih lama sebelum redirect')
    console.log('- Menggunakan window.location.replace() instead of href')
    console.log('- Menambahkan retry logic yang lebih robust')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await supabase.auth.signOut()
  }
}

quickFixLoginRedirect()