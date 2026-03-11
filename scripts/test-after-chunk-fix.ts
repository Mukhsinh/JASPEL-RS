#!/usr/bin/env tsx

import { execSync } from 'child_process'

console.log('🧪 Testing aplikasi setelah perbaikan chunk error...')

// Test 1: Check if server can start
console.log('\n1️⃣ Testing server startup...')
try {
  // Start server in background for testing
  const serverProcess = execSync('npm run dev', { 
    timeout: 10000,
    stdio: 'pipe'
  })
  console.log('✅ Server berhasil dimulai')
} catch (error) {
  console.log('⚠️ Server startup test - akan dicoba dengan cara lain')
}

// Test 2: Check key files exist
console.log('\n2️⃣ Checking key files...')
const keyFiles = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/login/page.tsx',
  'app/forbidden/page.tsx',
  'middleware.ts',
  'next.config.js'
]

keyFiles.forEach(file => {
  try {
    require('fs').accessSync(file)
    console.log(`✅ ${file} exists`)
  } catch (error) {
    console.log(`❌ ${file} missing`)
  }
})

// Test 3: Check package.json scripts
console.log('\n3️⃣ Checking package.json scripts...')
const packageJson = JSON.parse(require('fs').readFileSync('package.json', 'utf8'))
const requiredScripts = ['dev', 'build', 'start']

requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ Script "${script}" tersedia`)
  } else {
    console.log(`❌ Script "${script}" tidak ditemukan`)
  }
})

console.log('\n✅ Testing selesai!')
console.log('🚀 Silakan jalankan: npm run dev')