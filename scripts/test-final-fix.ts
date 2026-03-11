#!/usr/bin/env tsx

import { execSync } from 'child_process'

console.log('🧪 Testing aplikasi setelah perbaikan final...')

// 1. Test build
console.log('🔨 Testing build...')
try {
  execSync('npm run build', { stdio: 'inherit', timeout: 120000 })
  console.log('✅ Build berhasil')
} catch (error) {
  console.log('❌ Build gagal:', error)
  process.exit(1)
}

// 2. Test key pages exist
console.log('📄 Memeriksa halaman utama...')
const fs = require('fs')
const path = require('path')

const keyPages = [
  'app/login/page.tsx',
  'app/forbidden/page.tsx',
  'app/page.tsx',
  'app/layout.tsx',
  'middleware.ts'
]

for (const page of keyPages) {
  if (fs.existsSync(page)) {
    console.log(`✅ ${page} ada`)
  } else {
    console.log(`❌ ${page} tidak ditemukan`)
    process.exit(1)
  }
}

console.log('✅ Semua test berhasil!')
console.log('🚀 Aplikasi siap dijalankan dengan: npm run dev')
console.log('🌐 Akses aplikasi di: http://localhost:3002')
console.log('📋 Halaman yang dapat diakses:')
console.log('   - /login - Halaman login')
console.log('   - /forbidden - Halaman akses ditolak')
console.log('   - /dashboard - Dashboard (setelah login)')
console.log('   - /pool - Manajemen pool')
console.log('   - /settings - Pengaturan sistem')
console.log('   - /assessment - Penilaian KPI')