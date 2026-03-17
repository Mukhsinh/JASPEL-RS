#!/usr/bin/env tsx

/**
 * Test Assessment Employees Fix
 * 
 * This script tests the API endpoint to verify employees are now displayed
 */

async function testAssessmentEmployees() {
  console.log('🧪 Testing Assessment Employees API...\n')

  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:3003/api/assessment/employees?period=2026-01', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('📡 API Response Status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API call successful!')
      console.log('📊 Employees found:', data.employees?.length || 0)
      
      if (data.employees && data.employees.length > 0) {
        console.log('\n👥 Employee List:')
        data.employees.forEach((emp: any, index: number) => {
          console.log(`   ${index + 1}. ${emp.full_name} (${emp.unit_name})`)
          console.log(`      Status: ${emp.status}`)
          console.log(`      Indikator: ${emp.assessed_indicators}/${emp.total_indicators}`)
          console.log(`      Progress: ${emp.completion_percentage}%`)
          console.log('')
        })
      }
    } else {
      const errorData = await response.json()
      console.log('❌ API call failed:', errorData)
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  testAssessmentEmployees().catch(console.error)
}

export { testAssessmentEmployees }