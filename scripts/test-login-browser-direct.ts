#!/usr/bin/env tsx

import { config } from 'dotenv'
import { spawn } from 'child_process'

// Load environment variables
config({ path: '.env.local' })

async function testLoginInBrowser() {
  console.log('🚀 Starting development server for login test...')
  
  // Start the dev server
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  })
  
  let serverReady = false
  
  devServer.stdout?.on('data', (data) => {
    const output = data.toString()
    console.log(output)
    
    if (output.includes('localhost:3002') || output.includes('Ready in')) {
      serverReady = true
      console.log('\n✅ Server is ready!')
      console.log('🌐 Please test login manually at: http://localhost:3002/login')
      console.log('📧 Email: mukhsin9@gmail.com')
      console.log('🔑 Password: admin123')
      console.log('\n🔍 Check browser console for any errors during login')
      console.log('📋 After login, check if you are redirected to /dashboard')
      console.log('\n⏹️  Press Ctrl+C to stop the server when done testing')
    }
  })
  
  devServer.stderr?.on('data', (data) => {
    const error = data.toString()
    if (!error.includes('webpack.cache.PackFileCacheStrategy')) {
      console.error('❌ Server error:', error)
    }
  })
  
  devServer.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`)
  })
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...')
    devServer.kill()
    process.exit(0)
  })
}

testLoginInBrowser().catch(console.error)