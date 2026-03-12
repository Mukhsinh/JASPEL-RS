#!/usr/bin/env tsx

async function testLoginFunctionality() {
  console.log('🧪 Testing Login Functionality...')
  
  try {
    // Test login page content
    const response = await fetch('http://localhost:3002/login')
    const html = await response.text()
    
    console.log(`Login page status: ${response.status}`)
    
    // Check for key elements
    const checks = [
      { name: 'Sistem JASPEL title', found: html.includes('Sistem JASPEL') },
      { name: 'Email input', found: html.includes('email') || html.includes('Email') },
      { name: 'Password input', found: html.includes('password') || html.includes('Password') },
      { name: 'Login button', found: html.includes('Masuk') || html.includes('Login') },
      { name: 'CSS loaded', found: html.includes('/_next/static/css/') },
      { name: 'JS loaded', found: html.includes('/_next/static/chunks/') }
    ]
    
    console.log('\n📋 Hasil pemeriksaan:')
    checks.forEach(check => {
      console.log(`${check.found ? '✅' : '❌'} ${check.name}`)
    })
    
    const allPassed = checks.every(check => check.found)
    
    if (allPassed) {
      console.log('\n🎉 Login page berfungsi dengan baik!')
      console.log('✅ Semua komponen penting ditemukan')
    } else {
      console.log('\n⚠️  Ada beberapa komponen yang tidak ditemukan')
    }
    
  } catch (error) {
    console.log(`❌ Error testing login: ${error}`)
  }
}

testLoginFunctionality()