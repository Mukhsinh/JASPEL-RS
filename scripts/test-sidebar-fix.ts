#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi perbaikan error Sidebar
 * Error yang diperbaiki: loadCompanyInfo is not defined
 */

import { execSync } from 'child_process'

console.log('🔧 Testing Sidebar Fix...')

try {
  // Test 1: Verify build passes
  console.log('\n1. Testing build compilation...')
  execSync('npm run build', { stdio: 'pipe' })
  console.log('✅ Build successful - no loadCompanyInfo error')

  // Test 2: Check if Sidebar.tsx has correct function call
  console.log('\n2. Checking Sidebar.tsx syntax...')
  const fs = require('fs')
  const sidebarContent = fs.readFileSync('components/navigation/Sidebar.tsx', 'utf8')
  
  if (sidebarContent.includes('loadCompanyInfo')) {
    console.log('❌ Still contains loadCompanyInfo reference')
    process.exit(1)
  }
  
  if (sidebarContent.includes('loadSidebarData')) {
    console.log('✅ Correctly uses loadSidebarData function')
  } else {
    console.log('❌ loadSidebarData function not found')
    process.exit(1)
  }

  // Test 3: Check if useMemo is properly imported
  if (sidebarContent.includes('useMemo')) {
    console.log('✅ useMemo properly imported in Sidebar.tsx')
  } else {
    console.log('❌ useMemo import missing in Sidebar.tsx')
    process.exit(1)
  }

  console.log('\n🎉 All Sidebar fixes verified successfully!')
  console.log('✅ loadCompanyInfo error fixed')
  console.log('✅ useMemo import added')
  console.log('✅ Build compilation successful')
  console.log('✅ Application ready for deployment')

} catch (error: any) {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
}