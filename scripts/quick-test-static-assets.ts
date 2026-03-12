#!/usr/bin/env tsx

async function testStaticAssets() {
  console.log('🧪 Testing Static Assets...')
  
  try {
    // Test login page
    const loginResponse = await fetch('http://localhost:3002/login')
    console.log(`Login page status: ${loginResponse.status}`)
    
    if (loginResponse.ok) {
      const html = await loginResponse.text()
      
      // Check if page loads without 404 errors in content
      if (html.includes('Sistem JASPEL')) {
        console.log('✅ Login page berhasil dimuat')
      } else {
        console.log('⚠️  Login page dimuat tapi konten tidak lengkap')
      }
      
      // Check for static asset references
      const cssMatches = html.match(/_next\/static\/css/g)
      const jsMatches = html.match(/_next\/static\/chunks/g)
      
      console.log(`CSS assets found: ${cssMatches ? cssMatches.length : 0}`)
      console.log(`JS assets found: ${jsMatches ? jsMatches.length : 0}`)
      
      if (cssMatches && jsMatches) {
        console.log('✅ Static assets references ditemukan di HTML')
      }
    } else {
      console.log('❌ Login page tidak dapat diakses')
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error}`)
  }
}

testStaticAssets()