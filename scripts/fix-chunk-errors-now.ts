#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'

console.log('🔧 Memperbaiki Chunk Loading Errors...')

try {
  // 1. Stop any running processes
  console.log('⏹️ Menghentikan proses yang berjalan...')
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' })
  } catch (e) {
    // Process might not be running
  }

  // 2. Clean build artifacts
  console.log('🧹 Membersihkan build artifacts...')
  const pathsToClean = [
    '.next',
    'node_modules/.cache',
    'tsconfig.tsbuildinfo'
  ]

  pathsToClean.forEach(path => {
    if (existsSync(path)) {
      console.log(`   Menghapus ${path}...`)
      rmSync(path, { recursive: true, force: true })
    }
  })

  // 3. Clear npm cache
  console.log('🗑️ Membersihkan npm cache...')
  execSync('npm cache clean --force', { stdio: 'inherit' })

  // 4. Build the application
  console.log('🏗️ Building aplikasi...')
  execSync('npm run build', { stdio: 'inherit' })

  console.log('✅ Perbaikan selesai! Aplikasi siap dijalankan.')
  console.log('🚀 Jalankan: npm run dev')

} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}