import fetch from 'node-fetch'

async function testAssessmentEndpoints() {
  console.log('🧪 Testing Assessment API Endpoints...\n')
  
  const baseUrl = 'http://localhost:3000'
  const testPeriod = '2026-01'
  
  const endpoints = [
    `/api/assessment/status?period=${testPeriod}`,
    `/api/assessment/employees?period=${testPeriod}`,
    `/api/assessment/indicators?employee_id=test&period=${testPeriod}`
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`)
      const response = await fetch(`${baseUrl}${endpoint}`)
      const status = response.status
      
      if (status === 200) {
        const data = await response.json()
        console.log(`✅ ${endpoint} - Status: ${status}`)
        console.log(`   Response keys:`, Object.keys(data))
      } else if (status === 401) {
        console.log(`⚠️  ${endpoint} - Status: ${status} (Unauthorized - expected without login)`)
      } else if (status === 404) {
        console.log(`❌ ${endpoint} - Status: ${status} (Not Found)`)
      } else {
        const errorText = await response.text()
        console.log(`❌ ${endpoint} - Status: ${status}`)
        console.log(`   Error:`, errorText.substring(0, 100))
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Network Error:`, error.message)
    }
    console.log('')
  }
  
  console.log('✅ Endpoint testing completed!')
}

testAssessmentEndpoints()