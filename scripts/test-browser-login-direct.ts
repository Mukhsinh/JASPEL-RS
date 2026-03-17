#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testBrowserLogin() {
  console.log('🔍 Testing browser login flow...\n')
  
  try {
    // Create client like browser would
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('1. Clearing any existing session...')
    await supabase.auth.signOut({ scope: 'global' })
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('2. Attempting login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      console.error('   Error details:', JSON.stringify(loginError, null, 2))
      return
    }
    
    if (!loginData.user || !loginData.session) {
      console.error('❌ No user or session returned')
      return
    }
    
    console.log('✅ Login successful!')
    console.log('   User ID:', loginData.user.id)
    console.log('   Email:', loginData.user.email)
    console.log('   Role:', loginData.user.user_metadata?.role)
    
    console.log('\n3. Testing session persistence...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session retrieval failed:', sessionError.message)
      return
    }
    
    if (!sessionData.session) {
      console.error('❌ No session found after login')
      return
    }
    
    console.log('✅ Session persisted correctly')
    console.log('   Expires at:', new Date(sessionData.session.expires_at! * 1000).toLocaleString())
    
    console.log('\n4. Testing employee data access...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id')
      .eq('user_id', loginData.user.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee data access failed:', empError.message)
      return
    }
    
    console.log('✅ Employee data accessible')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    
    console.log('\n5. Testing auth state changes...')
    let authStateChanged = false
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`   Auth state changed: ${event}`)
      if (session) {
        console.log(`   Session valid until: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
      }
      authStateChanged = true
    })
    
    // Wait for auth state change
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (authStateChanged) {
      console.log('✅ Auth state change listener working')
    } else {
      console.log('⚠️  Auth state change not detected')
    }
    
    // Clean up
    subscription.unsubscribe()
    await supabase.auth.signOut()
    
    console.log('\n✅ Browser login test completed successfully')
    console.log('\n💡 Jika masih ada masalah login di browser:')
    console.log('   1. Buka DevTools (F12)')
    console.log('   2. Pergi ke Application/Storage tab')
    console.log('   3. Hapus semua localStorage dan sessionStorage')
    console.log('   4. Hapus semua cookies untuk domain ini')
    console.log('   5. Refresh halaman dan coba login lagi')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testBrowserLogin()