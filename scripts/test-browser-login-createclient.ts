#!/usr/bin/env tsx

/**
 * Test script untuk simulasi browser environment dan test createClient
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

// Simulate browser environment
global.window = {
  localStorage: {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {}
  },
  document: {
    cookie: ''
  }
} as any

async function testBrowserCreateClient() {
  console.log('🔍 Testing createClient dalam simulasi browser environment...')
  
  try {
    // Import seperti di login page
    const { createClient } = await import('@/lib/supabase/client')
    console.log('✅ Import createClient berhasil')
    
    // Test createClient function
    const supabase = createClient()
    console.log('✅ createClient() berhasil dipanggil')
    
    // Test getSession
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('✅ getSession() berhasil dipanggil')
    console.log('📊 Session:', session ? 'Ada' : 'Tidak ada')
    console.log('📊 Error:', error ? error.message : 'Tidak ada')
    
    return true
  } catch (error) {
    console.error('❌ Error dalam browser environment:', error)
    return false
  }
}

async function testAuthServiceLogin() {
  console.log('\n🔍 Testing authService.login...')
  
  try {
    const { authService } = await import('@/lib/services/auth.service')
    console.log('✅ Import authService berhasil')
    
    // Test dengan kredensial yang salah untuk melihat apakah function berjalan
    const result = await authService.login({ 
      email: 'test@test.com', 
      password: 'wrongpassword' 
    })
    
    console.log('✅ authService.login berhasil dipanggil')
    console.log('📊 Result:', result.success ? 'Success' : 'Failed (expected)')
    
    return true
  } catch (error) {
    console.error('❌ Error testing authService:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testing browser environment untuk createClient\n')
  
  const test1 = await testBrowserCreateClient()
  const test2 = await testAuthServiceLogin()
  
  if (test1 && test2) {
    console.log('\n✅ Semua test berhasil! createClient seharusnya berfungsi di browser.')
    console.log('💡 Jika masih ada error di browser, coba:')
    console.log('   1. Hard refresh (Ctrl+Shift+R)')
    console.log('   2. Clear browser cache')
    console.log('   3. Restart dev server')
  } else {
    console.log('\n❌ Masih ada masalah dengan createClient.')
  }
}

main().catch(console.error)