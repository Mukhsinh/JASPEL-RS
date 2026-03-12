#!/usr/bin/env tsx

/**
 * Test Export Fix
 * Tests the fixed export functionality for both Excel and PDF formats
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testExportFix() {
  console.log('🧪 Testing Export Fix...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Get a test unit
    console.log('1. Getting test unit...')
    const { data: units, error: unitsError } = await supabase
      .from('m_units')
      .select('id, code, name')
      .eq('is_active', true)
      .limit(1)

    if (unitsError || !units || units.length === 0) {
      console.error('❌ No units found:', unitsError)
      return
    }

    const testUnit = units[0]
    console.log(`   ✅ Using unit: ${testUnit.code} - ${testUnit.name}`)

    // 2. Test Excel export endpoint
    console.log('\n2. Testing Excel export endpoint...')
    const excelUrl = `http://localhost:3000/api/kpi-config/export?unitId=${testUnit.id}&format=excel`
    
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

    // 3. Test PDF export endpoint
    console.log('\n3. Testing PDF export endpoint...')
    const pdfUrl = `http://localhost:3000/api/kpi-config/export?unitId=${testUnit.id}&format=pdf`
    
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

    // 4. Test data structure
    console.log('\n4. Testing data structure...')
    const { data: categories, error: catError } = await supabase
      .from('m_kpi_categories')
      .select('*')
      .eq('unit_id', testUnit.id)
      .eq('is_active', true)

    if (catError) {
      console.log(`   ❌ Categories error: ${catError.message}`)
    } else {
      console.log(`   ✅ Found ${categories?.length || 0} categories`)
      
      for (const category of categories || []) {
        const { data: indicators } = await supabase
          .from('m_kpi_indicators')
          .select('*')
          .eq('category_id', category.id)
          .eq('is_active', true)

        console.log(`   - ${category.category}: ${indicators?.length || 0} indicators`)
        
        for (const indicator of indicators || []) {
          const { data: subIndicators } = await supabase
            .from('m_kpi_sub_indicators')
            .select('*')
            .eq('indicator_id', indicator.id)
            .eq('is_active', true)

          if (subIndicators && subIndicators.length > 0) {
            console.log(`     - ${indicator.code}: ${subIndicators.length} sub indicators`)
          }
        }
      }
    }

    console.log('\n✅ Export fix test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testExportFix()