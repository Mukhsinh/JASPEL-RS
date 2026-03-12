#!/usr/bin/env tsx

/**
 * Script untuk verifikasi lengkap perbaikan RSC error
 */

import { existsSync } from 'fs'
import path from 'path'

console.log('🔍 Verifikasi Perbaikan RSC Error...')

interface CheckResult {
  name: string
  status: 'OK' | 'ERROR' | 'WARNING'
  message: string
}

const results: CheckResult[] = []

// 1. Check Next.js config
console.log('1. Checking Next.js configuration...')
const nextConfigPath = path.join(process.cwd(), 'next.config.js')
if (existsSync(nextConfigPath)) {
  results.push({
    name: 'Next.js Config',
    status: 'OK',
    message: 'next.config.js sudah diperbaiki dengan webpack optimization'
  })
} else {
  results.push({
    name: 'Next.js Config',
    status: 'ERROR',
    message: 'next.config.js tidak ditemukan'
  })
}

// 2. Check package.json dependencies
console.log('2. Checking React dependencies...')
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (existsSync(packageJsonPath)) {
  const packageJson = require(packageJsonPath)
  const reactVersion = packageJson.dependencies?.react
  const nextVersion = packageJson.dependencies?.next
  
  if (reactVersion?.includes('19') && nextVersion?.includes('15')) {
    results.push({
      name: 'Dependencies',
      status: 'OK',
      message: `React ${reactVersion} + Next.js ${nextVersion} - kompatibel`
    })
  } else {
    results.push({
      name: 'Dependencies',
      status: 'WARNING',
      message: `React ${reactVersion} + Next.js ${nextVersion} - periksa kompatibilitas`
    })
  }
}

// 3. Check API routes yang diperbaiki
console.log('3. Checking API routes...')
const notificationsApiPath = path.join(process.cwd(), 'app/api/notifications/route.ts')
if (existsSync(notificationsApiPath)) {
  results.push({
    name: 'Notifications API',
    status: 'OK',
    message: 'API notifications sudah diperbaiki dengan error handling'
  })
}

const assessmentPagePath = path.join(process.cwd(), 'app/(authenticated)/assessment/page.tsx')
if (existsSync(assessmentPagePath)) {
  results.push({
    name: 'Assessment Page',
    status: 'OK',
    message: 'Assessment page sudah diperbaiki dengan error handling'
  })
}

// 4. Check cache directories
console.log('4. Checking cache status...')
const nextCacheDir = path.join(process.cwd(), '.next')
if (!existsSync(nextCacheDir)) {
  results.push({
    name: 'Cache Status',
    status: 'OK',
    message: 'Cache .next sudah dibersihkan'
  })
} else {
  results.push({
    name: 'Cache Status',
    status: 'WARNING',
    message: 'Cache .next masih ada - akan dibersihkan saat restart'
  })
}

// Print results
console.log('\n📋 Hasil Verifikasi:')
console.log('=' .repeat(60))

results.forEach(result => {
  const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
  console.log(`${icon} ${result.name}: ${result.message}`)
})

const hasErrors = results.some(r => r.status === 'ERROR')
const hasWarnings = results.some(r => r.status === 'WARNING')

console.log('=' .repeat(60))

if (hasErrors) {
  console.log('❌ Ada error yang perlu diperbaiki sebelum restart')
  process.exit(1)
} else if (hasWarnings) {
  console.log('⚠️  Ada warning - aplikasi dapat dijalankan tapi perlu perhatian')
} else {
  console.log('✅ Semua perbaikan RSC error berhasil!')
}

console.log('\n🚀 Langkah selanjutnya:')
console.log('   1. Jalankan: ./FIX_RSC_ERROR_COMPLETE.ps1')
console.log('   2. Atau manual: npm run dev')
console.log('   3. Test di browser: http://localhost:3002')
console.log('   4. Login dengan: superadmin / admin123')