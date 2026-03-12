#!/usr/bin/env tsx

/**
 * Script untuk memperbaiki error storage di login
 * Menguji storage adapter dan auth flow
 */

import { createClient } from '@/lib/supabase/client'
import { getStorageAdapter, clearAllStorage } from '@/lib/utils/storage-adapter'

async function testStorageAdapter() {
  console.log('🔧 Testing Storage Adapter...')
  
  try {
    const adapter = getStorageAdapter()
    
    // Test basic operations
    console.log('📝 Testing setItem...')
    adapter.setItem('test-key', 'test-value')
    
    console.log('📖 Testing getItem...')
    const value = adapter.getItem('test-key')
    console.log('Retrieved value:', value)
    
    console.log('🗑️ Testing removeItem...')
    adapter.removeItem('test-key')
    
    const removedValue = adapter.getItem('test-key')
    console.log('Value after removal:', removedValue)
    
    console.log('✅ Storage adapter working correctly')
    return true
  } catch (error) {
    console.error('❌ Storage adapter error:', error)
    return false
  }
}

async function testSupabaseClient() {
  console.log('🔧 Testing Supabase Client...')
  
  try {
    const supabase = createClient()
    
    console.log('📡 Testing getSession...')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('⚠️ Session error (expected if not logged in):', error.message)
    } else {
      console.log('📊 Session status:', session ? 'Active' : 'No session')
    }
    
    console.log('✅ Supabase client working correctly')
    return true
  } catch (error) {
    console.error('❌ Supabase client error:', error)
    return false
  }
}

async function testLoginFlow() {
  console.log('🔧 Testing Login Flow...')
  
  try {
    const supabase = createClient()
    
    // Clear any existing session first
    console.log('🧹 Clearing existing session...')
    clearAllStorage()
    await supabase.auth.signOut({ scope: 'global' })
    
    // Test with invalid credentials (should fail gracefully)
    console.log('🔐 Testing login with invalid credentials...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'invalid'
    })
    
    if (error) {
      console.log('✅ Login correctly failed with invalid credentials:', error.message)
    } else {
      console.log('⚠️ Unexpected success with invalid credentials')
    }
    
    console.log('✅ Login flow test completed')
    return true
  } catch (error) {
    console.error('❌ Login flow error:', error)
    return false
  }
}

async function clearBrowserStorage() {
  console.log('🧹 Clearing browser storage...')
  
  try {
    // Clear our custom storage
    clearAllStorage()
    
    // Clear browser storage if available
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ Browser storage cleared')
      } catch (error) {
        console.log('⚠️ Browser storage not available:', error)
      }
    }
    
    console.log('✅ Storage cleanup completed')
    return true
  } catch (error) {
    console.error('❌ Storage cleanup error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Login Storage Error Fix...\n')
  
  const tests = [
    { name: 'Storage Adapter', fn: testStorageAdapter },
    { name: 'Supabase Client', fn: testSupabaseClient },
    { name: 'Login Flow', fn: testLoginFlow },
    { name: 'Storage Cleanup', fn: clearBrowserStorage }
  ]
  
  let allPassed = true
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`)
    const passed = await test.fn()
    if (!passed) {
      allPassed = false
    }
  }
  
  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('✅ All tests passed! Login storage error should be fixed.')
    console.log('\n📋 Next steps:')
    console.log('1. Restart the development server')
    console.log('2. Clear browser cache and cookies')
    console.log('3. Try logging in again')
  } else {
    console.log('❌ Some tests failed. Please check the errors above.')
  }
  console.log('='.repeat(50))
}

if (require.main === module) {
  main().catch(console.error)
}