#!/usr/bin/env tsx

/**
 * Fix Sidebar loadCompanyInfo error
 * This script verifies the fix and provides instructions to clear browser cache
 */

import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('🔍 Checking Sidebar component for loadCompanyInfo error...')
  
  try {
    const sidebarPath = join(process.cwd(), 'components/navigation/Sidebar.tsx')
    const content = readFileSync(sidebarPath, 'utf-8')
    
    // Check if loadCompanyInfo is still referenced
    if (content.includes('loadCompanyInfo')) {
      console.log('❌ Found loadCompanyInfo reference in Sidebar.tsx')
      console.log('This should have been replaced with loadSidebarData')
      return
    }
    
    // Check if loadSidebarData exists
    if (!content.includes('loadSidebarData')) {
      console.log('❌ loadSidebarData function not found')
      return
    }
    
    // Check if setTimeout calls loadSidebarData
    if (!content.includes('setTimeout(loadSidebarData')) {
      console.log('❌ setTimeout should call loadSidebarData')
      return
    }
    
    console.log('✅ Sidebar component is fixed!')
    console.log('\n📋 To resolve the browser error:')
    console.log('1. Stop the development server (Ctrl+C)')
    console.log('2. Clear browser cache and storage:')
    console.log('   - Open DevTools (F12)')
    console.log('   - Right-click refresh button → "Empty Cache and Hard Reload"')
    console.log('   - Or go to Application tab → Storage → Clear site data')
    console.log('3. Restart development server: npm run dev')
    console.log('4. Refresh the page')
    
    console.log('\n🚀 The error should be resolved after clearing cache!')
    
  } catch (error) {
    console.error('❌ Error checking file:', error)
  }
}

main().catch(console.error)