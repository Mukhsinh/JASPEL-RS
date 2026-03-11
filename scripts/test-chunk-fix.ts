#!/usr/bin/env tsx

console.log('🧪 Testing Chunk Loading Fix...')

const testUrls = [
  'http://localhost:3002',
  'http://localhost:3002/login',
  'http://localhost:3002/dashboard',
]

async function testChunkLoading() {
  console.log('📡 Testing chunk loading pada berbagai halaman...')
  
  for (const url of testUrls) {
    try {
      console.log(`\n🔍 Testing: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Check for chunk references
        const chunkMatches = html.match(/_next\/static\/chunks\/[^"]+/g) || []
        console.log(`   ✅ Status: ${response.status}`)
        console.log(`   📦 Chunks found: ${chunkMatches.length}`)
        
        if (chunkMatches.length > 0) {
          console.log(`   🔗 Sample chunks:`)
          chunkMatches.slice(0, 3).forEach(chunk => {
            console.log(`      - ${chunk}`)
          })
        }
      } else {
        console.log(`   ❌ Status: ${response.status}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }
}

async function main() {
  try {
    await testChunkLoading()
    
    console.log('\n✅ Test selesai!')
    console.log('🌐 Buka browser dan periksa console untuk memastikan tidak ada error 404 chunk')
    console.log('📍 URL: http://localhost:3002')
    
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  }
}

main()