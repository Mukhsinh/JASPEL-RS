/**
 * Test Dashboard Endpoints
 * Test semua endpoint yang sebelumnya error
 */

async function testEndpoints() {
  console.log('🧪 Testing Dashboard Endpoints...\n')

  const baseUrl = 'http://localhost:3002'
  
  // Test endpoints
  const endpoints = [
    { name: 'Dashboard Page', url: '/dashboard' },
    { name: 'Notifications API', url: '/api/notifications?unreadOnly=true' },
    { name: 'KPI Config API', url: '/api/kpi-config' },
    { name: 'Pegawai Page', url: '/pegawai' },
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`)
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        headers: {
          'Cookie': 'sb-access-token=test' // Dummy cookie untuk test
        }
      })
      
      const status = response.status
      const statusText = response.statusText
      
      if (status === 200) {
        console.log(`   ✓ ${endpoint.name}: OK (${status})`)
      } else if (status === 401 || status === 403) {
        console.log(`   ⚠ ${endpoint.name}: Auth required (${status}) - Expected`)
      } else if (status === 500) {
        console.log(`   ✗ ${endpoint.name}: Server Error (${status})`)
        const text = await response.text()
        console.log(`   Error: ${text.substring(0, 200)}`)
      } else {
        console.log(`   ℹ ${endpoint.name}: ${status} ${statusText}`)
      }
    } catch (error: any) {
      console.log(`   ✗ ${endpoint.name}: ${error.message}`)
    }
    console.log('')
  }

  console.log('✅ Endpoint test completed!')
  console.log('\n📋 Perbaikan yang dilakukan:')
  console.log('   1. Fixed notification query - user_id mapping')
  console.log('   2. Fixed dashboard employee query - m_units relation')
  console.log('   3. Added timeout handling untuk notifications')
  console.log('   4. Fixed TypeScript types')
  console.log('\n🎯 Silakan test di browser: http://localhost:3002/dashboard')
}

testEndpoints()
