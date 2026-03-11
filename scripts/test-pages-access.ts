#!/usr/bin/env tsx

console.log('🧪 Testing akses halaman setelah perbaikan...')

const testUrls = [
  'http://localhost:3002',
  'http://localhost:3002/login',
  'http://localhost:3002/forbidden'
]

async function testPageAccess(url: string) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script'
      }
    })
    
    if (response.ok) {
      console.log(`✅ ${url} - Status: ${response.status}`)
      return true
    } else {
      console.log(`⚠️ ${url} - Status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${url} - Error: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('\n🔍 Testing page access...')
  
  for (const url of testUrls) {
    await testPageAccess(url)
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n✅ Testing selesai!')
}

runTests().catch(console.error)