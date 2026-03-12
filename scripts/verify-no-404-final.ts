#!/usr/bin/env tsx

async function verifyNo404Errors() {
  console.log('🔍 Verifikasi tidak ada error 404...')
  
  try {
    // Test beberapa static asset paths yang biasanya error
    const testPaths = [
      '/login',
      '/_next/static/css/app/layout.css',
      '/_next/static/chunks/main-app.js',
      '/_next/static/chunks/app-pages-internals.js'
    ]
    
    let allOk = true
    
    for (const path of testPaths) {
      try {
        const response = await fetch(`http://localhost:3002${path}`)
        
        if (response.status === 404) {
          console.log(`❌ 404 Error: ${path}`)
          allOk = false
        } else if (response.ok) {
          console.log(`✅ OK (${response.status}): ${path}`)
        } else {
          console.log(`⚠️  Status ${response.status}: ${path}`)
        }
      } catch (error) {
        console.log(`❌ Network error untuk ${path}: ${error}`)
        allOk = false
      }
    }
    
    if (allOk) {
      console.log('\n🎉 Semua asset berhasil dimuat, tidak ada error 404!')
      console.log('✅ Masalah static assets sudah diperbaiki')
    } else {
      console.log('\n⚠️  Masih ada beberapa asset yang bermasalah')
    }
    
  } catch (error) {
    console.log(`❌ Error during verification: ${error}`)
  }
}

verifyNo404Errors()