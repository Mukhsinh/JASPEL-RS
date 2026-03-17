#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function fixBrowserLoginIssue() {
  console.log('🔧 Memperbaiki masalah login browser...\n')
  
  try {
    // 1. Test server connection
    console.log('1. Testing server connection...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.from('m_employees').select('count').limit(1)
    if (error) {
      console.error('❌ Server connection failed:', error.message)
      return
    }
    console.log('✅ Server connection OK')
    
    // 2. Check if there are any stuck sessions
    console.log('\n2. Checking for stuck sessions...')
    const { data: sessions } = await supabase.auth.admin.listUsers()
    console.log(`✅ Found ${sessions.users.length} users in auth system`)
    
    // 3. Test fresh login
    console.log('\n3. Testing fresh login...')
    await supabase.auth.signOut({ scope: 'global' })
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Fresh login failed:', loginError.message)
      return
    }
    
    console.log('✅ Fresh login successful')
    
    // 4. Generate browser fix instructions
    console.log('\n4. Generating browser fix instructions...')
    
    const fixInstructions = `
🔧 PANDUAN PERBAIKAN LOGIN BROWSER

Jika Anda mengalami masalah login di browser, ikuti langkah berikut:

LANGKAH 1: Bersihkan Browser Cache
1. Buka browser dan tekan F12 untuk membuka DevTools
2. Klik kanan pada tombol refresh dan pilih "Empty Cache and Hard Reload"
3. Atau gunakan Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)

LANGKAH 2: Bersihkan Storage
1. Di DevTools, pergi ke tab "Application" (Chrome) atau "Storage" (Firefox)
2. Di sidebar kiri, klik "Local Storage" dan hapus semua data
3. Klik "Session Storage" dan hapus semua data
4. Klik "Cookies" dan hapus semua cookies untuk domain ini

LANGKAH 3: Bersihkan Supabase Storage
1. Di Console DevTools, jalankan perintah berikut:
   localStorage.clear()
   sessionStorage.clear()
   
2. Hapus cookies Supabase secara manual:
   document.cookie.split(";").forEach(c => {
     const cookieName = c.split("=")[0].trim()
     if (cookieName.includes('sb-') || cookieName.includes('supabase')) {
       document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
     }
   })

LANGKAH 4: Restart Browser
1. Tutup semua tab browser
2. Tutup browser sepenuhnya
3. Buka browser kembali
4. Pergi ke halaman login
5. Coba login dengan kredensial: mukhsin9@gmail.com / admin123

LANGKAH 5: Jika Masih Bermasalah
1. Coba browser lain (Chrome, Firefox, Edge)
2. Coba mode incognito/private
3. Periksa apakah ada extension browser yang memblokir

INFORMASI TEKNIS:
- Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
- Login berhasil di backend: ✅
- Database connection: ✅
- Auth system: ✅

Jika semua langkah di atas tidak berhasil, kemungkinan ada masalah dengan:
- Network/firewall yang memblokir koneksi ke Supabase
- Browser extension yang mengganggu
- Antivirus yang memblokir JavaScript
`
    
    console.log(fixInstructions)
    
    // Clean up
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('❌ Error during fix:', error)
  }
}

fixBrowserLoginIssue()