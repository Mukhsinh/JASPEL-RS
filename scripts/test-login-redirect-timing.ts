#!/usr/bin/env tsx

/**
 * Script untuk menguji timing issue pada login redirect
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulateLoginRedirectFlow() {
  console.log('🔄 Simulating login redirect flow...')
  
  try {
    const email = 'mukhsin9@gmail.com'
    const password = 'admin123'
    
    // 1. Login
    console.log('1️⃣ Performing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful')
    
    // 2. Simulate different wait times and check session
    const waitTimes = [100, 500, 1000, 1500, 2000, 3000]
    
    for (const waitTime of waitTimes) {
      console.log(`\n⏱️  Testing session after ${waitTime}ms wait...`)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.log(`❌ Session error after ${waitTime}ms:`, sessionError.message)
        continue
      }
      
      if (sessionData.session) {
        console.log(`✅ Session available after ${waitTime}ms`)
        console.log(`   User: ${sessionData.session.user.email}`)
        console.log(`   Role: ${sessionData.session.user.user_metadata?.role}`)
      } else {
        console.log(`❌ No session after ${waitTime}ms`)
      }
    }
    
    // 3. Test multiple rapid session checks (simulate middleware behavior)
    console.log('\n🔄 Testing rapid session checks (middleware simulation)...')
    
    for (let i = 0; i < 5; i++) {
      const start = Date.now()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const duration = Date.now() - start
      
      console.log(`Check ${i + 1}: ${duration}ms - ${sessionData.session ? '✅ Session found' : '❌ No session'}`)
      
      if (sessionError) {
        console.log(`   Error: ${sessionError.message}`)
      }
      
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Cleanup
    await supabase.auth.signOut()
    console.log('\n🧹 Signed out')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function testStoragePersistence() {
  console.log('\n💾 Testing storage persistence...')
  
  // Simulate browser storage behavior
  const mockStorage = new Map<string, string>()
  
  const testStorage = {
    getItem: (key: string) => {
      const value = mockStorage.get(key)
      console.log(`📖 Storage.getItem(${key}): ${value ? 'found' : 'not found'}`)
      return value || null
    },
    setItem: (key: string, value: string) => {
      mockStorage.set(key, value)
      console.log(`💾 Storage.setItem(${key}): stored`)
    },
    removeItem: (key: string) => {
      mockStorage.delete(key)
      console.log(`🗑️  Storage.removeItem(${key}): removed`)
    }
  }
  
  // Simulate auth token storage
  console.log('Simulating auth token storage...')
  testStorage.setItem('sb-omlbijupllrglmebbqnn-auth-token', '{"access_token":"test","refresh_token":"test"}')
  
  // Test retrieval
  const token = testStorage.getItem('sb-omlbijupllrglmebbqnn-auth-token')
  console.log(`Token retrieved: ${token ? 'yes' : 'no'}`)
}

async function main() {
  console.log('🚀 Starting login redirect timing test...\n')
  
  await simulateLoginRedirectFlow()
  await testStoragePersistence()
  
  console.log('\n📋 Analysis:')
  console.log('- Session should be available immediately after login')
  console.log('- If session is not found, it indicates a storage/persistence issue')
  console.log('- Middleware should wait or retry if session is temporarily unavailable')
  console.log('- Use window.location.replace() for redirect to prevent back button issues')
}

if (require.main === module) {
  main().catch(console.error)
}