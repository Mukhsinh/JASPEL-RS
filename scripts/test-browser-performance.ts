#!/usr/bin/env tsx

/**
 * Script untuk test performance di browser
 * Mengukur loading time halaman-halaman utama
 */

import { spawn } from 'child_process'
import { setTimeout } from 'timers/promises'

interface PageTest {
  name: string
  url: string
  expectedElements: string[]
}

const pages: PageTest[] = [
  {
    name: 'Login Page',
    url: 'http://localhost:3000/login',
    expectedElements: ['form', 'input[type="email"]', 'input[type="password"]']
  },
  {
    name: 'Dashboard (after login)',
    url: 'http://localhost:3000/dashboard',
    expectedElements: ['.stat-card', '.performance-chart', '.sidebar']
  },
  {
    name: 'KPI Config',
    url: 'http://localhost:3000/kpi-config', 
    expectedElements: ['.kpi-tree', '.category-form']
  },
  {
    name: 'Pool Management',
    url: 'http://localhost:3000/pool',
    expectedElements: ['.pool-table', '.pool-form']
  },
  {
    name: 'Assessment',
    url: 'http://localhost:3000/assessment',
    expectedElements: ['.assessment-table', '.assessment-form']
  }
]

async function testBrowserPerformance() {
  console.log('🌐 Testing Browser Performance\n')
  
  // Check if server is running
  console.log('🔍 Checking if development server is running...')
  
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (!response.ok) {
      throw new Error('Health check failed')
    }
    console.log('✅ Server is running\n')
  } catch (error) {
    console.log('❌ Server not running. Please start with: npm run dev')
    console.log('   Or run: npm run start (for production build)\n')
    return
  }

  // Test each page
  for (const page of pages) {
    console.log(`🧪 Testing: ${page.name}`)
    console.log(`   URL: ${page.url}`)
    
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      const response = await fetch(page.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Performance-Test-Script'
        }
      })
      
      const loadTime = Date.now() - startTime
      
      if (response.ok) {
        console.log(`   ✅ Response: ${response.status} (${loadTime}ms)`)
        
        // Check caching headers
        const cacheControl = response.headers.get('cache-control')
        if (cacheControl) {
          console.log(`   📦 Cache: ${cacheControl}`)
        }
        
        // Check content type
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('text/html')) {
          console.log(`   📄 Content: HTML page`)
        }
        
      } else {
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${(error as Error).message}`)
    }
    
    console.log()
    
    // Small delay between tests
    await setTimeout(500)
  }

  // Test API endpoints
  console.log('🔌 Testing API Performance:')
  
  const apiTests = [
    '/api/dashboard/stats',
    '/api/dashboard/performance', 
    '/api/dashboard/top-performers',
    '/api/dashboard/activities'
  ]
  
  for (const endpoint of apiTests) {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'Authorization': 'Bearer test-token' // This will fail but we can measure response time
        }
      })
      
      const loadTime = Date.now() - startTime
      console.log(`   ${endpoint}: ${response.status} (${loadTime}ms)`)
      
    } catch (error) {
      console.log(`   ${endpoint}: Error (${(error as Error).message})`)
    }
  }

  console.log('\n📊 Performance Analysis:')
  console.log('=' .repeat(50))
  console.log('✅ Fast responses (< 100ms): Excellent')
  console.log('⚠️  Medium responses (100-500ms): Good') 
  console.log('❌ Slow responses (> 500ms): Needs optimization')
  
  console.log('\n💡 Next Steps:')
  console.log('1. Open browser DevTools → Network tab')
  console.log('2. Navigate to each page manually')
  console.log('3. Check for:')
  console.log('   • Total page load time')
  console.log('   • Number of requests')
  console.log('   • Largest contentful paint (LCP)')
  console.log('   • First input delay (FID)')
  console.log('   • Cumulative layout shift (CLS)')
  
  console.log('\n🎯 Performance Targets:')
  console.log('• Page load: < 2 seconds')
  console.log('• API calls: < 200ms')
  console.log('• Dashboard render: < 1 second')
  console.log('• Sidebar load: < 500ms')
}

if (require.main === module) {
  testBrowserPerformance()
}