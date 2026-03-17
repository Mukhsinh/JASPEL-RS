#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi perbaikan error createClient di login page
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@/lib/supabase/client'

async function testCreateClientImport() {
  console.log('🔍 Testing createClient import...')
  
  try {
    // Test import
    const supabase = createClient()
    console.log('✅ createClient import berhasil')
    
    // Test basic functionality
    const { data: { session } } = await supabase.auth.getSession()
    console.log('✅ getSession berhasil dipanggil')
    
    console.log('📊 Session status:', session ? 'Ada session' : 'Tidak ada session')
    
    return true
  } catch (error) {
    console.error('❌ Error testing createClient:', error)
    return false
  }
}

async function testLoginPageImports() {
  console.log('\n🔍 Testing login page imports...')
  
  try {
    // Simulate import yang ada di login page
    const { authService } = await import('@/lib/services/auth.service')
    const { createClient } = await import('@/lib/supabase/client')
    
    console.log('✅ authService import berhasil')
    console.log('✅ createClient import berhasil')
    
    // Test createClient function
    const supabase = createClient()
    console.log('✅ createClient function berhasil dipanggil')
    
    return true
  } catch (error) {
    console.error('❌ Error testing login page imports:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Testing createClient fix untuk login page\n')
  
  const test1 = await testCreateClientImport()
  const test2 = await testLoginPageImports()
  
  if (test1 && test2) {
    console.log('\n✅ Semua test berhasil! Error createClient seharusnya sudah teratasi.')
  } else {
    console.log('\n❌ Masih ada masalah dengan createClient import.')
  }
}

main().catch(console.error)