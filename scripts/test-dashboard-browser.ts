#!/usr/bin/env tsx

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function testDashboardInBrowser() {
  console.log('🧪 Testing dashboard in browser...')
  
  try {
    // Test if server is running
    console.log('\n1. Checking if server is running...')
    
    const response = await fetch('http://localhost:3002')
    if (response.ok) {
      console.log('✅ Server is running on port 3002')
    } else {
      console.log('❌ Server not responding properly')
      return
    }
    
    // Test dashboard endpoint
    console.log('\n2. Testing dashboard stats API...')
    
    const statsResponse = await fetch('http://localhost:3002/api/dashboard/stats')
    if (statsResponse.ok) {
      const statsData = await statsResponse.json()
      console.log('✅ Dashboard stats API working:', statsData)
    } else {
      console.log('❌ Dashboard stats API error:', statsResponse.status, statsResponse.statusText)
    }
    
    // Test dashboard page
    console.log('\n3. Testing dashboard page...')
    
    const dashboardResponse = await fetch('http://localhost:3002/dashboard')
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard page accessible')
    } else {
      console.log('❌ Dashboard page error:', dashboardResponse.status, dashboardResponse.statusText)
    }
    
    console.log('\n🎉 Dashboard tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDashboardInBrowser()