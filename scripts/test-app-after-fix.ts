#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

console.log('🧪 Testing aplikasi setelah perbaikan chunk error...')

// 1. Check if .env.local exists
console.log('📋 Memeriksa konfigurasi...')
try {
  const envContent = readFileSync('.env.local', 'utf8')
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ Environment variables OK')
  } else {
    console.log('❌ Environment variables tidak lengkap')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ File .env.local tidak ditemukan')
  process.exit(1)
}

// 2. Check package.json
console.log('📦 Memeriksa dependencies...')
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  if (packageJson.dependencies['next'] && packageJson.dependencies['react']) {
    console.log('✅ Dependencies OK')
  } else {
    console.log('❌ Dependencies tidak lengkap')
    process.exit(1)
  }
} catch (error) {
  console.log('❌ Error membaca package.json:', error)
  process.exit(1)
}

// 3. Test build
console.log('🔨 Testing build...')
try {
  execSync('npm run build', { stdio: 'inherit', timeout: 120000 })
  console.log('✅ Build berhasil')
} catch (error) {
  console.log('❌ Build gagal:', error)
  process.exit(1)
}

console.log('✅ Semua test berhasil!')
console.log('🚀 Aplikasi siap dijalankan dengan: npm run dev')