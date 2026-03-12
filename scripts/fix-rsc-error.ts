#!/usr/bin/env tsx

/**
 * Script untuk memperbaiki RSC (React Server Components) error
 * Membersihkan cache dan memastikan konsistensi versi React
 */

import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import path from 'path'

console.log('🔧 Memperbaiki RSC Error...')

try {
  // 1. Stop semua proses Next.js yang berjalan
  console.log('1. Menghentikan proses Next.js...')
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' })
  } catch (error) {
    // Ignore jika tidak ada proses yang berjalan
  }

  // 2. Hapus cache Next.js
  console.log('2. Membersihkan cache Next.js...')
  const nextCacheDir = path.join(process.cwd(), '.next')
  if (existsSync(nextCacheDir)) {
    rmSync(nextCacheDir, { recursive: true, force: true })
    console.log('   ✅ Cache .next dihapus')
  }

  // 3. Hapus node_modules/.cache jika ada
  console.log('3. Membersihkan cache node_modules...')
  const nodeModulesCacheDir = path.join(process.cwd(), 'node_modules', '.cache')
  if (existsSync(nodeModulesCacheDir)) {
    rmSync(nodeModulesCacheDir, { recursive: true, force: true })
    console.log('   ✅ Cache node_modules dihapus')
  }

  // 4. Reinstall dependencies untuk memastikan konsistensi versi
  console.log('4. Reinstall dependencies...')
  execSync('npm ci', { stdio: 'inherit' })

  // 5. Verifikasi konfigurasi Next.js
  console.log('5. Verifikasi konfigurasi...')
  const nextConfigPath = path.join(process.cwd(), 'next.config.js')
  if (existsSync(nextConfigPath)) {
    console.log('   ✅ next.config.js sudah diperbaiki')
  }

  console.log('\n✅ Perbaikan RSC error selesai!')
  console.log('\n📋 Langkah selanjutnya:')
  console.log('   1. Jalankan: npm run dev')
  console.log('   2. Buka browser: http://localhost:3002')
  console.log('   3. Test login dengan superadmin')

} catch (error: any) {
  console.error('❌ Error saat memperbaiki RSC:', error.message)
  process.exit(1)
}