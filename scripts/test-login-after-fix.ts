#!/usr/bin/env tsx

/**
 * Test login setelah perbaikan error
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function testLogin() {
  console.log('🧪 Testing login setelah perbaikan...')
  
  try {
    // Test dengan fetch ke API login
    const response = await fetch('http://localhost:3002/login', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    console.log('📊 Status response:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      console.log('✅ Halaman login dapat diakses')
      
      // Test environment variables
      console.log('\n🔧 Environment Variables:')
      console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
      console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
      console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
      
    } else {
      console.log('❌ Error mengakses halaman login:', response.statusText)
    }

    // Test static assets
    console.log('\n🎨 Testing static assets...')
    
    const faviconResponse = await fetch('http://localhost:3002/favicon.ico')
    console.log('Favicon:', faviconResponse.status === 200 ? '✅' : '❌')
    
    const nextResponse = await fetch('http://localhost:3002/_next/static/css/app/layout.css')
    console.log('CSS Assets:', nextResponse.status === 200 ? '✅' : '❌ (Normal jika tidak ada)')

  } catch (error) {
    console.error('💥 Error dalam test:', error)
  }
}

testLogin().catch(console.error)