#!/usr/bin/env tsx

console.log('🔧 Testing Assessment Fix...')

// Start the development server and test the assessment page
import { spawn } from 'child_process'

const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
})

let serverReady = false

server.stdout?.on('data', (data) => {
  const output = data.toString()
  console.log('Server:', output.trim())
  
  if (output.includes('Ready') || output.includes('localhost:3000')) {
    serverReady = true
    console.log('✅ Server is ready!')
    
    // Test the assessment API after server is ready
    setTimeout(async () => {
      try {
        console.log('\n🧪 Testing assessment API...')
        
        const response = await fetch('http://localhost:3000/api/assessment/employees?period=2026-01', {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ API Response:', data)
        } else {
          const error = await response.text()
          console.log('❌ API Error:', error)
        }
        
      } catch (error) {
        console.error('❌ Test failed:', error)
      } finally {
        console.log('\n🛑 Stopping server...')
        server.kill()
        process.exit(0)
      }
    }, 3000)
  }
})

server.stderr?.on('data', (data) => {
  const output = data.toString()
  if (!output.includes('warn') && !output.includes('Duplicate atom key')) {
    console.error('Server Error:', output.trim())
  }
})

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`)
})

// Timeout after 30 seconds
setTimeout(() => {
  if (!serverReady) {
    console.log('❌ Server failed to start within 30 seconds')
    server.kill()
    process.exit(1)
  }
}, 30000)