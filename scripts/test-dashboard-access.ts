#!/usr/bin/env tsx

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testDashboardAccess() {
  console.log('🔍 Testing dashboard access...')
  
  try {
    // Test if dashboard endpoint is accessible
    const response = await fetch('http://localhost:3002/dashboard', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    console.log('Dashboard response status:', response.status)
    console.log('Dashboard response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location')
      console.log('Redirect location:', location)
    }
    
    // Test login page access
    const loginResponse = await fetch('http://localhost:3002/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    console.log('Login page status:', loginResponse.status)
    
  } catch (err) {
    console.error('❌ Error testing dashboard access:', err)
  }
}

testDashboardAccess().catch(console.error)