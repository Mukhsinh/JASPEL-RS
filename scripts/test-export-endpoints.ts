#!/usr/bin/env tsx

/**
 * Test Export Endpoints
 * Simple test untuk endpoint export tanpa dependency environment variables
 */

async function testExportEndpoints() {
  console.log('🧪 Testing Export Endpoints...\n')

  // Test unit ID yang digunakan di error log
  const testUnitId = '8914356c-4ec8-4bd7-bc5e-5fb619f6c3f2'
  const baseUrl = 'http://localhost:3000'

  try {
    // 1. Test Excel export endpoint
    console.log('1. Testing Excel export endpoint...')
    const excelUrl = `${baseUrl}/api/kpi-config/export?unitId=${testUnitId}&format=excel`
    
    try {
      const response = await fetch(excelUrl)
      console.log(`   Status: ${response.status}`)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        console.log(`   ✅ Excel export successful`)
        console.log(`   Content-Type: ${contentType}`)
        console.log(`   Content-Length: ${contentLength} bytes`)
      } else {
        const errorText = await response.text()
        console.log(`   ❌ Excel export failed: ${errorText}`)
      }
    } catch (error) {
      console.log(`   ❌ Excel export error: ${error}`)
    }

    // 2. Test PDF export endpoint
    console.log('\n2. Testing PDF export endpoint...')
    const pdfUrl = `${baseUrl}/api/kpi-config/export?unitId=${testUnitId}&format=pdf`
    
    try {
      const response = await fetch(pdfUrl)
      console.log(`   Status: ${response.status}`)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        console.log(`   ✅ PDF export successful`)
        console.log(`   Content-Type: ${contentType}`)
        console.log(`   Content-Length: ${contentLength} bytes`)
      } else {
        const errorText = await response.text()
        console.log(`   ❌ PDF export failed: ${errorText}`)
      }
    } catch (error) {
      console.log(`   ❌ PDF export error: ${error}`)
    }

    // 3. Test Guide PDF endpoint
    console.log('\n3. Testing Guide PDF endpoint...')
    const guideUrl = `${baseUrl}/api/kpi-config/guide`
    
    try {
      const response = await fetch(guideUrl)
      console.log(`   Status: ${response.status}`)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        console.log(`   ✅ Guide PDF successful`)
        console.log(`   Content-Type: ${contentType}`)
        console.log(`   Content-Length: ${contentLength} bytes`)
      } else {
        const errorText = await response.text()
        console.log(`   ❌ Guide PDF failed: ${errorText}`)
      }
    } catch (error) {
      console.log(`   ❌ Guide PDF error: ${error}`)
    }

    console.log('\n✅ Export endpoints test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testExportEndpoints()