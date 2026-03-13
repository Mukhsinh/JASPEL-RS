// Test KPI Config endpoint
const testEndpoint = async () => {
  console.log('Testing KPI Config endpoint...\n')
  
  try {
    const response = await fetch('http://localhost:3002/api/kpi-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      console.error('\n❌ Request failed!')
    } else {
      console.log('\n✓ Request successful!')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testEndpoint()
