#!/usr/bin/env tsx

import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'

console.log('🧪 Testing Static Assets Fix...')

// Function to test if server is responding
async function testServer(port: number = 3002): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/login`)
    console.log(`✅ Server responding with status: ${response.status}`)
    return response.ok
  } catch (error) {
    console.log(`❌ Server not responding: ${error}`)
    return false
  }
}

// Function to check for 404 errors in console
async function checkStaticAssets(port: number = 3002): Promise<boolean> {
  try {
    // Test common static asset paths
    const staticPaths = [
      '/_next/static/css/app/layout.css',
      '/_next/static/chunks/main-app.js',
      '/_next/static/chunks/app-pages-internals.js'
    ]
    
    let allAssetsOk = true
    
    for (const path of staticPaths) {
      try {
        const response = await fetch(`http://localhost:${port}${path}`)
        if (response.status === 404) {
          console.log(`❌ Asset not found: ${path}`)
          allAssetsOk = false
        } else {
          console.log(`✅ Asset loaded: ${path} (${response.status})`)
        }
      } catch (error) {
        console.log(`⚠️  Could not test asset: ${path}`)
      }
    }
    
    return allAssetsOk
  } catch (error) {
    console.log(`❌ Error checking static assets: ${error}`)
    return false
  }
}

async function main() {
  console.log('1. Checking if Next.js config is clean...')
  
  if (existsSync('next.config.clean.js')) {
    console.log('✅ Clean config found')
  } else {
    console.log('❌ Clean config not found')
    return
  }
  
  console.log('2. Testing server response...')
  
  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const serverOk = await testServer()
  if (!serverOk) {
    console.log('❌ Server is not responding properly')
    return
  }
  
  console.log('3. Testing static assets...')
  
  const assetsOk = await checkStaticAssets()
  if (assetsOk) {
    console.log('🎉 All static assets are loading correctly!')
  } else {
    console.log('⚠️  Some static assets are still having issues')
  }
  
  console.log('4. Testing login page specifically...')
  
  try {
    const response = await fetch('http://localhost:3002/login')
    const html = await response.text()
    
    if (html.includes('Sistem JASPEL')) {
      console.log('✅ Login page content loaded correctly')
    } else {
      console.log('❌ Login page content not found')
    }
  } catch (error) {
    console.log(`❌ Error testing login page: ${error}`)
  }
  
  console.log('\n📊 Test Summary:')
  console.log(`Server Status: ${serverOk ? '✅ OK' : '❌ Failed'}`)
  console.log(`Static Assets: ${assetsOk ? '✅ OK' : '❌ Failed'}`)
}

main().catch(console.error)