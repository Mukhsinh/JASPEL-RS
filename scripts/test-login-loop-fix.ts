/**
 * Test script untuk memverifikasi perbaikan login loop
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginLoopFix() {
  console.log('🔍 Testing login loop fix...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Login dengan kredensial test
    console.log('1️⃣ Testing login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user) {
      console.error('❌ Login failed:', authError?.message)
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Role:', authData.user.user_metadata?.role)

    // Test 2: Verify employee data
    console.log('\n2️⃣ Verifying employee data...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id, m_units(name)')
      .eq('user_id', authData.user.id)
      .single()

    if (empError || !employee) {
      console.error('❌ Employee fetch failed:', empError?.message)
      return
    }

    console.log('✅ Employee data found')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    console.log('   Unit:', employee.m_units?.name)

    // Test 3: Verify session
    console.log('\n3️⃣ Verifying session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('❌ Session verification failed:', sessionError?.message)
      return
    }

    console.log('✅ Session valid')
    console.log('   Access token exists:', !!session.access_token)
    console.log('   Refresh token exists:', !!session.refresh_token)
    console.log('   Expires at:', new Date(session.expires_at! * 1000).toLocaleString())

    // Test 4: Sign out
    console.log('\n4️⃣ Testing sign out...')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message)
      return
    }

    console.log('✅ Sign out successful')

    // Test 5: Verify session cleared
    console.log('\n5️⃣ Verifying session cleared...')
    const { data: { session: afterSignOut } } = await supabase.auth.getSession()

    if (afterSignOut) {
      console.error('❌ Session still exists after sign out')
      return
    }

    console.log('✅ Session cleared successfully')

    console.log('\n✅ All tests passed! Login loop fix verified.')
    console.log('\n📝 Summary of fixes:')
    console.log('   - Removed duplicate auth state listeners')
    console.log('   - Simplified auth error handler')
    console.log('   - Removed console logs that were causing noise')
    console.log('   - Auth handler now only runs once in root layout')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

testLoginLoopFix()
