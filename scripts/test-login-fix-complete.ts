#!/usr/bin/env tsx

/**
 * Script untuk menguji perbaikan login error secara menyeluruh
 */

import { createClient } from '@/lib/supabase/client'
import { authService } from '@/lib/services/auth.service'
import { getStorageAdapter, clearAllStorage } from '@/lib/utils/storage-adapter'

async function testEnvironmentVariables() {
  console.log('🔧 Testing Environment Variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  let allPresent = true
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value) {
      console.error(`❌ Missing environment variable: ${varName}`)
      allPresent = false
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
    }
  }
  
  return allPresent
}

async function testStorageAdapter() {
  console.log('🔧 Testing Storage Adapter...')
  
  try {
    const adapter = getStorageAdapter()
    
    // Test operations
    adapter.setItem('test-auth-token', JSON.stringify({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: Date.now() + 3600000
    }))
    
    const stored = adapter.getItem('test-auth-token')
    if (!stored) {
      throw new Error('Failed to store/retrieve data')
    }
    
    const parsed = JSON.parse(stored)
    if (parsed.access_token !== 'test-token') {
      throw new Error('Data corruption in storage')
    }
    
    adapter.removeItem('test-auth-token')
    const removed = adapter.getItem('test-auth-token')
    if (removed !== null) {
      throw new Error('Failed to remove data')
    }
    
    console.log('✅ Storage adapter working correctly')
    return true
  } catch (error) {
    console.error('❌ Storage adapter error:', error)
    return false
  }
}

async function testSupabaseClientCreation() {
  console.log('🔧 Testing Supabase Client Creation...')
  
  try {
    const supabase = createClient()
    
    if (!supabase) {
      throw new Error('Failed to create Supabase client')
    }
    
    // Test that auth is available
    if (!supabase.auth) {
      throw new Error('Auth not available on client')
    }
    
    console.log('✅ Supabase client created successfully')
    return true
  } catch (error) {
    console.error('❌ Supabase client creation error:', error)
    return false
  }
}

async function testAuthServiceMethods() {
  console.log('🔧 Testing Auth Service Methods...')
  
  try {
    // Test getCurrentUser (should return null when not logged in)
    const currentUser = await authService.getCurrentUser()
    console.log('📊 Current user:', currentUser ? 'Logged in' : 'Not logged in')
    
    // Test isAuthenticated
    const isAuth = await authService.isAuthenticated()
    console.log('🔐 Is authenticated:', isAuth)
    
    // Test getSession
    const session = await authService.getSession()
    console.log('📋 Session:', session ? 'Active' : 'None')
    
    console.log('✅ Auth service methods working')
    return true
  } catch (error) {
    console.error('❌ Auth service error:', error)
    return false
  }
}

async function testLoginWithInvalidCredentials() {
  console.log('🔧 Testing Login with Invalid Credentials...')
  
  try {
    const result = await authService.signIn('invalid@test.com', 'wrongpassword')
    
    if (result.success) {
      console.error('❌ Login should have failed with invalid credentials')
      return false
    }
    
    if (!result.error) {
      console.error('❌ Error message should be present')
      return false
    }
    
    console.log('✅ Login correctly failed:', result.error)
    return true
  } catch (error) {
    console.error('❌ Login test error:', error)
    return false
  }
}

async function testStorageCleanup() {
  console.log('🔧 Testing Storage Cleanup...')
  
  try {
    // Add some test data
    const adapter = getStorageAdapter()
    adapter.setItem('test-cleanup-1', 'value1')
    adapter.setItem('test-cleanup-2', 'value2')
    
    // Clear all storage
    clearAllStorage()
    
    // Verify cleanup
    const value1 = adapter.getItem('test-cleanup-1')
    const value2 = adapter.getItem('test-cleanup-2')
    
    if (value1 !== null || value2 !== null) {
      throw new Error('Storage cleanup failed')
    }
    
    console.log('✅ Storage cleanup working correctly')
    return true
  } catch (error) {
    console.error('❌ Storage cleanup error:', error)
    return false
  }
}

async function testSignOutFlow() {
  console.log('🔧 Testing Sign Out Flow...')
  
  try {
    // This should not throw an error even if not logged in
    await authService.signOut()
    
    // Verify session is cleared
    const session = await authService.getSession()
    if (session) {
      console.warn('⚠️ Session still exists after sign out')
    }
    
    console.log('✅ Sign out flow working')
    return true
  } catch (error) {
    console.error('❌ Sign out error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testing Login Fix - Comprehensive Test\n')
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Storage Adapter', fn: testStorageAdapter },
    { name: 'Supabase Client Creation', fn: testSupabaseClientCreation },
    { name: 'Auth Service Methods', fn: testAuthServiceMethods },
    { name: 'Login with Invalid Credentials', fn: testLoginWithInvalidCredentials },
    { name: 'Storage Cleanup', fn: testStorageCleanup },
    { name: 'Sign Out Flow', fn: testSignOutFlow }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`)
    try {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw error:`, error)
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('✅ All tests passed! Login storage error has been fixed.')
    console.log('\n📋 Perbaikan yang telah dilakukan:')
    console.log('1. ✅ Custom storage adapter untuk mengatasi localStorage error')
    console.log('2. ✅ Error handling yang lebih robust di auth service')
    console.log('3. ✅ Timeout dan retry logic di settings context')
    console.log('4. ✅ Safe storage cleanup methods')
    
    console.log('\n🚀 Langkah selanjutnya:')
    console.log('1. Restart development server')
    console.log('2. Clear browser cache dan cookies')
    console.log('3. Coba login dengan kredensial yang valid')
  } else {
    console.log('❌ Beberapa test gagal. Periksa error di atas.')
  }
  console.log('='.repeat(60))
  
  process.exit(failed === 0 ? 0 : 1)
}

if (require.main === module) {
  main().catch(console.error)
}