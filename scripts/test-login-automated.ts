#!/usr/bin/env tsx

/**
 * Script untuk test login secara otomatis
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testLoginFlow() {
  console.log('🔐 Testing automated login flow...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return false
    }
    
    console.log('✅ Login successful')
    
    // Test session persistence with multiple checks
    let sessionFound = false
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 250))
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionData.session && !sessionError) {
        console.log(`✅ Session found on attempt ${i + 1}`)
        sessionFound = true
        break
      }
      
      console.log(`⏳ Session check ${i + 1}/10...`)
    }
    
    if (!sessionFound) {
      console.error('❌ Session not found after 10 attempts')
      return false
    }
    
    // Cleanup
    await supabase.auth.signOut()
    console.log('🧹 Signed out')
    
    return true
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting automated login test...\n')
  
  const success = await testLoginFlow()
  
  if (success) {
    console.log('\n✅ Login flow test PASSED')
    console.log('\n📋 Next steps:')
    console.log('1. Buka browser: http://localhost:3004/login')
    console.log('2. Login dengan: mukhsin9@gmail.com / admin123')
    console.log('3. Pastikan diarahkan ke /dashboard')
    console.log('4. Cek console browser untuk log detail')
  } else {
    console.log('\n❌ Login flow test FAILED')
    console.log('Periksa konfigurasi Supabase dan database')
  }
}

if (require.main === module) {
  main().catch(console.error)
}