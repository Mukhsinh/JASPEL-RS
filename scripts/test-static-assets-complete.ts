#!/usr/bin/env tsx

console.log('🧪 Testing Static Assets Fix...')

// Function to test server response
async function testServer(port: number = 3002): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/login`)
    console.log(`✅ Server merespons dengan status: ${response.status}`)
    return response.ok
  } catch (error) {
    console.log(`❌ Server tidak merespons: ${error}`)
    return false
  }
}

// Function to check static assets
async function checkStaticAssets(port: number = 3002): Promise<boolean> {
  try {
    // Test common static asset paths yang biasanya error 404
    const staticPaths = [
      '/_next/static/css/app/layout.css',
      '/_next/static/chunks/main-app.js',
      '/_next/static/chunks/app-pages-internals.js',
      '/_next/static/chunks/app/error.js',
      '/_next/static/chunks/app/not-found.js'
    ]
    
    let allAssetsOk = true
    let loadedAssets = 0
    
    for (const path of staticPaths) {
      try {
        const response = await fetch(`http://localhost:${port}${path}`)
        if (response.status === 404) {
          console.log(`❌ Asset tidak ditemukan: ${path}`)
          allAssetsOk = false
        } else if (response.ok) {
          console.log(`✅ Asset berhasil dimuat: ${path}`)
          loadedAssets++
        } else {
          console.log(`⚠️  Asset status ${response.status}: ${path}`)
        }
      } catch (error) {
        console.log(`⚠️  Tidak dapat test asset: ${path}`)
      }
    }
    
    console.log(`📊 Assets berhasil dimuat: ${loadedAssets}/${staticPaths.length}`)
    return allAssetsOk
  } catch (error) {
    console.log(`❌ Error checking static assets: ${error}`)
    return false
  }
}

// Function to test login page content
async function testLoginPage(port: number = 3002): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/login`)
    const html = await response.text()
    
    if (html.includes('Sistem JASPEL')) {
      console.log('✅ Halaman login berhasil dimuat dengan konten yang benar')
      return true
    } else {
      console.log('❌ Konten halaman login tidak ditemukan')
      return false
    }
  } catch (error) {
    console.log(`❌ Error testing login page: ${error}`)
    return false
  }
}

async function main() {
  console.log('1. Menunggu server siap...')
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('2. Testing server response...')
  const serverOk = await testServer()
  
  if (!serverOk) {
    console.log('❌ Server tidak merespons dengan baik')
    return
  }
  
  console.log('3. Testing static assets...')
  const assetsOk = await checkStaticAssets()
  
  console.log('4. Testing login page...')
  const loginOk = await testLoginPage()
  
  console.log('\n📊 Ringkasan Test:')
  console.log(`Server Status: ${serverOk ? '✅ OK' : '❌ Gagal'}`)
  console.log(`Static Assets: ${assetsOk ? '✅ OK' : '❌ Ada masalah'}`)
  console.log(`Login Page: ${loginOk ? '✅ OK' : '❌ Gagal'}`)
  
  if (serverOk && assetsOk && loginOk) {
    console.log('\n🎉 Semua test berhasil! Static assets sudah diperbaiki.')
  } else {
    console.log('\n⚠️  Masih ada masalah yang perlu diperbaiki.')
  }
}

main().catch(console.error)