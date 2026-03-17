/**
 * Verify all fixes are in place
 */

import * as fs from 'fs'
import * as path from 'path'

function verifyAllFixes() {
  console.log('🔍 VERIFYING ALL FIXES\n')
  console.log('=' .repeat(60))

  const checks = []

  // Check 1: Supabase client simplified
  console.log('\n1️⃣ Checking lib/supabase/client.ts')
  console.log('-'.repeat(60))
  const clientContent = fs.readFileSync('lib/supabase/client.ts', 'utf-8')
  const hasCustomStorage = clientContent.includes('storage:') && clientContent.includes('getItem:')
  const hasCustomCookies = clientContent.includes('cookies:') && clientContent.includes('get(name')
  
  if (!hasCustomStorage && !hasCustomCookies) {
    console.log('✅ Custom storage adapter removed')
    console.log('✅ Custom cookie handlers removed')
    checks.push(true)
  } else {
    console.log('❌ Still has custom storage/cookies')
    checks.push(false)
  }

  // Check 2: Login page simplified
  console.log('\n2️⃣ Checking app/login/page.tsx')
  console.log('-'.repeat(60))
  const loginContent = fs.readFileSync('app/login/page.tsx', 'utf-8')
  const hasSignOut = loginContent.includes('signOut')
  const hasDelay = loginContent.includes('setTimeout') && loginContent.includes('100')
  
  if (!hasSignOut) {
    console.log('✅ SignOut before login removed')
    checks.push(true)
  } else {
    console.log('❌ Still has signOut before login')
    checks.push(false)
  }

  // Check 3: Pegawai page no duplicate
  console.log('\n3️⃣ Checking app/(authenticated)/pegawai/page.tsx')
  console.log('-'.repeat(60))
  const pegawaiContent = fs.readFileSync('app/(authenticated)/pegawai/page.tsx', 'utf-8')
  const hasSetupCall = pegawaiContent.includes('setupAuthErrorHandler()')
  const importsSetup = pegawaiContent.includes('setupAuthErrorHandler')
  
  if (!hasSetupCall && !importsSetup) {
    console.log('✅ Duplicate setupAuthErrorHandler removed')
    checks.push(true)
  } else {
    console.log('❌ Still has setupAuthErrorHandler call')
    checks.push(false)
  }

  // Check 4: Auth session handler simplified
  console.log('\n4️⃣ Checking lib/utils/auth-session.ts')
  console.log('-'.repeat(60))
  const authSessionContent = fs.readFileSync('lib/utils/auth-session.ts', 'utf-8')
  const hasMinimalComment = authSessionContent.includes('MINIMAL VERSION')
  const hasConsoleLog = authSessionContent.includes('console.log') && authSessionContent.includes('[AUTH_HANDLER]')
  
  if (hasMinimalComment && !hasConsoleLog) {
    console.log('✅ Auth handler simplified')
    console.log('✅ Console logs removed')
    checks.push(true)
  } else {
    console.log('❌ Auth handler not simplified or still has logs')
    checks.push(false)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  const allPassed = checks.every(c => c)
  
  if (allPassed) {
    console.log('✅ ALL FIXES VERIFIED')
    console.log('='.repeat(60))
    console.log('\nSemua perbaikan sudah diterapkan dengan benar!')
    console.log('\nLangkah selanjutnya:')
    console.log('1. Jalankan: .\\RESTART_LOGIN_FINAL_FIX.ps1')
    console.log('2. Clear browser storage (F12 > Application > Clear site data)')
    console.log('3. Test login di http://localhost:3000/login')
    console.log('4. Verify bisa akses dashboard dan semua menu')
  } else {
    console.log('❌ SOME FIXES MISSING')
    console.log('='.repeat(60))
    console.log('\nAda perbaikan yang belum diterapkan!')
    console.log('Silakan review file-file di atas.')
  }
}

verifyAllFixes()
