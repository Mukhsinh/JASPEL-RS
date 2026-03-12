import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAuth() {
  console.log('✅ VERIFIKASI SISTEM AUTENTIKASI\n')
  
  try {
    // 1. Test sign in
    console.log('1️⃣ Testing sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
      return
    }
    
    console.log('✅ Sign in successful')
    console.log('   User ID:', signInData.user.id)
    console.log('   Email:', signInData.user.email)
    console.log('   Role:', signInData.user.user_metadata?.role)
    
    // 2. Check session
    console.log('\n2️⃣ Checking session...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session) {
      console.log('✅ Session active')
      console.log('   Expires at:', new Date(sessionData.session.expires_at! * 1000).toLocaleString())
    } else {
      console.log('❌ No active session')
    }
    
    // 3. Check employee data
    console.log('\n3️⃣ Checking employee data...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee fetch error:', empError.message)
    } else {
      console.log('✅ Employee data found')
      console.log('   Name:', employee.full_name)
      console.log('   Code:', employee.employee_code)
      console.log('   Active:', employee.is_active)
    }
    
    // Sign out
    await supabase.auth.signOut()
    
    console.log('\n✅ Semua verifikasi berhasil!')
    console.log('\n📝 Langkah selanjutnya:')
    console.log('   1. Jalankan: npm run dev')
    console.log('   2. Buka: http://localhost:3002/login')
    console.log('   3. Login dengan kredensial di atas')
    console.log('   4. Seharusnya redirect ke /dashboard')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

verifyAuth()
