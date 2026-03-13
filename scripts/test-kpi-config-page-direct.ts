import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testPageAccess() {
  console.log('🧪 TESTING KPI CONFIG PAGE ACCESS\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Sign in first
  console.log('1️⃣ Signing in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mukhsin9@gmail.com',
    password: 'admin123'
  })

  if (authError) {
    console.error('❌ Auth error:', authError)
    return
  }
  console.log('✅ Signed in')

  // Try to access the page
  console.log('\n2️⃣ Accessing /kpi-config page...')
  try {
    const cookies = [
      `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
        expires_in: authData.session?.expires_in,
        token_type: 'bearer',
        user: authData.user
      })}`
    ]

    const response = await fetch('http://localhost:3002/kpi-config', {
      headers: {
        'Cookie': cookies.join('; ')
      }
    })

    console.log('   Status:', response.status)
    console.log('   Status Text:', response.statusText)
    
    if (response.status === 500) {
      const text = await response.text()
      console.log('\n❌ ERROR 500 Response:')
      console.log(text.substring(0, 500))
    } else {
      console.log('✅ Page loaded successfully')
    }
  } catch (error: any) {
    console.error('❌ Fetch error:', error.message)
  }
}

testPageAccess().catch(console.error)
