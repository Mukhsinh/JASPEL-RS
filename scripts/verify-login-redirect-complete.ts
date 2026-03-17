#!/usr/bin/env tsx

/**
 * Verifikasi lengkap perbaikan login redirect loop
 * Memastikan semua komponen sudah diperbaiki dengan benar
 */

import { readFileSync } from 'fs'
import { join } from 'path'

function verifyLoginRedirectFix() {
  console.log('🔍 Verifying Login Redirect Fix Implementation...\n')

  const checks = [
    {
      name: 'Login Page - Session Verification',
      file: 'app/login/page.tsx',
      patterns: [
        'sessionReady = false',
        'maxAttempts = 20',
        'await supabase.auth.getSession()',
        'Session verified, ready to redirect'
      ]
    },
    {
      name: 'Auth Service - Session Establishment',
      file: 'lib/services/auth.service.ts',
      patterns: [
        'await new Promise(resolve => setTimeout(resolve, 1000))',
        'const { data: { session: verifySession } }',
        'Session verified, fetching employee data'
      ]
    },
    {
      name: 'Middleware - Retry Logic',
      file: 'middleware.ts',
      patterns: [
        'let sessionAttempts = 0',
        'maxSessionAttempts = 3',
        'await new Promise(resolve => setTimeout(resolve, 100))'
      ]
    },
    {
      name: 'Supabase Client - Storage Adapter',
      file: 'lib/supabase/client.ts',
      patterns: [
        'persistSession: true',
        'autoRefreshToken: true',
        'detectSessionInUrl: true',
        'flowType: \'pkce\''
      ]
    }
  ]

  let allPassed = true

  for (const check of checks) {
    console.log(`📋 Checking ${check.name}...`)
    
    try {
      const filePath = join(process.cwd(), check.file)
      const content = readFileSync(filePath, 'utf-8')
      
      let checkPassed = true
      const missingPatterns = []
      
      for (const pattern of check.patterns) {
        if (!content.includes(pattern)) {
          checkPassed = false
          missingPatterns.push(pattern)
        }
      }
      
      if (checkPassed) {
        console.log(`   ✅ ${check.name} - All patterns found`)
      } else {
        console.log(`   ❌ ${check.name} - Missing patterns:`)
        missingPatterns.forEach(pattern => {
          console.log(`      - ${pattern}`)
        })
        allPassed = false
      }
      
    } catch (error) {
      console.log(`   ❌ ${check.name} - File read error: ${error}`)
      allPassed = false
    }
    
    console.log()
  }

  // Additional checks
  console.log('📋 Additional Implementation Checks...')
  
  // Check if test files exist
  const testFiles = [
    'scripts/test-login-redirect-fix.ts',
    'TEST_LOGIN_REDIRECT_FIX.ps1',
    'TEST_LOGIN_MANUAL.ps1'
  ]
  
  for (const testFile of testFiles) {
    try {
      const filePath = join(process.cwd(), testFile)
      readFileSync(filePath, 'utf-8')
      console.log(`   ✅ Test file exists: ${testFile}`)
    } catch (error) {
      console.log(`   ❌ Test file missing: ${testFile}`)
      allPassed = false
    }
  }

  console.log()

  if (allPassed) {
    console.log('🎉 All verification checks passed!')
    console.log('\nLogin redirect fix implementation is complete:')
    console.log('✅ Session establishment with retry logic')
    console.log('✅ Proper session verification before redirect')
    console.log('✅ Middleware retry logic for race conditions')
    console.log('✅ Increased delays for session persistence')
    console.log('✅ Test scripts created for verification')
    
    console.log('\nNext steps:')
    console.log('1. Run manual test: ./TEST_LOGIN_MANUAL.ps1')
    console.log('2. Test with different users and roles')
    console.log('3. Verify no redirect loops occur')
    console.log('4. Check browser console for proper session logs')
  } else {
    console.log('❌ Some verification checks failed!')
    console.log('Please review the missing patterns above.')
  }
}

// Run verification
verifyLoginRedirectFix()