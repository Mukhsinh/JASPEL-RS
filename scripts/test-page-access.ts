#!/usr/bin/env tsx

import { spawn } from 'child_process'
import { setTimeout } from 'timers/promises'

console.log('🧪 Testing akses halaman aplikasi...')

// Start development server
console.log('🚀 Memulai development server...')
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
})

let serverReady = false

server.stdout?.on('data', (data) => {
  const output = data.toString()
  if (output.includes('Ready') || output.includes('localhost:3002')) {
    serverReady = true
    console.log('✅ Server siap!')
  }
})

server.stderr?.on('data', (data) => {
  const output = data.toString()
  if (output.includes('Ready') || output.includes('localhost:3002')) {
    serverReady = true
    console.log('✅ Server siap!')
  }
})

// Wait for server to be ready
console.log('⏳ Menunggu server siap...')
let attempts = 0
while (!serverReady && attempts < 30) {
  await setTimeout(2000)
  attempts++
  console.log(`⏳ Menunggu server... (${attempts}/30)`)
}

if (!serverReady) {
  console.log('❌ Server tidak siap dalam waktu yang ditentukan')
  server.kill()
  process.exit(1)
}

// Test pages
const testPages = [
  { path: '/login', name: 'Login Page' },
  { path: '/forbidden', name: 'Forbidden Page' },
  { path: '/', name: 'Home Page' }
]

console.log('🌐 Testing akses halaman...')

for (const page of testPages) {
  try {
    const response = await fetch(`http://localhost:3002${page.path}`)
    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log(`✅ ${page.name} (${page.path}) - Status: ${response.status}`)
    } else {
      console.log(`⚠️ ${page.name} (${page.path}) - Status: ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ ${page.name} (${page.path}) - Error: ${error}`)
  }
}

console.log('✅ Test selesai!')
console.log('🌐 Aplikasi berjalan di: http://localhost:3002')
console.log('🔑 Login dengan: admin@jaspel.com / admin123')

// Keep server running for manual testing
console.log('⏹️ Tekan Ctrl+C untuk menghentikan server dan keluar')

process.on('SIGINT', () => {
  console.log('\n🛑 Menghentikan server...')
  server.kill()
  process.exit(0)
})

// Keep process alive
setInterval(() => {}, 1000)