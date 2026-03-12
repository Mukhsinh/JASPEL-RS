#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi UI form sub indikator dengan kriteria fleksibel
 * Akan mengakses halaman KPI Config dan test form functionality
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSubIndicatorFormUI() {
  console.log('🧪 Testing Sub Indicator Form UI with Flexible Criteria...\n')

  try {
    // 1. Verify we have test data to work with
    console.log('1. Checking available test data...')
    
    const { data: categories, error: catError } = await supabase
      .from('m_kpi_categories')
      .select(`
        id, category_name,
        indicators:m_kpi_indicators(
          id, name,
          sub_indicators:m_kpi_sub_indicators(id, name, scoring_criteria)
        )
      `)
      .limit(1)

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message)
      return false
    }

    if (!categories?.length) {
      console.error('❌ No categories found for testing')
      return false
    }

    const category = categories[0]
    console.log(`✅ Found category: ${category.category_name}`)
    
    if (!category.indicators?.length) {
      console.error('❌ No indicators found in category')
      return false
    }

    const indicator = category.indicators[0]
    console.log(`✅ Found indicator: ${indicator.name}`)
    console.log(`   Sub indicators: ${indicator.sub_indicators?.length || 0}`)

    // 2. Test API endpoint for KPI config
    console.log('\n2. Testing KPI Config API endpoint...')
    
    const response = await fetch('http://localhost:3000/api/kpi-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ API endpoint failed: ${response.status} ${response.statusText}`)
      return false
    }

    const apiData = await response.json()
    console.log('✅ KPI Config API working')
    console.log(`   Categories returned: ${apiData.length}`)

    // 3. Test page accessibility
    console.log('\n3. Testing KPI Config page accessibility...')
    
    const pageResponse = await fetch('http://localhost:3000/kpi-config', {
      method: 'GET',
      headers: {
        'Accept': 'text/html'
      }
    })

    if (!pageResponse.ok) {
      console.error(`❌ Page not accessible: ${pageResponse.status} ${pageResponse.statusText}`)
      return false
    }

    console.log('✅ KPI Config page accessible')

    // 4. Verify sub indicator data structure
    console.log('\n4. Verifying sub indicator data structure...')
    
    const { data: subIndicators, error: subError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('id, name, scoring_criteria')
      .limit(5)

    if (subError) {
      console.error('❌ Error fetching sub indicators:', subError.message)
      return false
    }

    console.log('✅ Sub indicators data structure:')
    subIndicators?.forEach(sub => {
      const criteriaCount = Array.isArray(sub.scoring_criteria) ? sub.scoring_criteria.length : 0
      console.log(`   - ${sub.name}: ${criteriaCount} criteria`)
      
      if (criteriaCount > 0 && Array.isArray(sub.scoring_criteria)) {
        const firstCriterion = sub.scoring_criteria[0]
        if (firstCriterion && typeof firstCriterion === 'object' && 'score' in firstCriterion && 'label' in firstCriterion) {
          console.log(`     Example: Score ${firstCriterion.score} - ${firstCriterion.label}`)
        }
      }
    })

    // 5. Test form component compatibility
    console.log('\n5. Testing form component structure...')
    
    // Check if the new form component exists
    const fs = require('fs')
    const formPath = 'components/kpi/SubIndicatorFormDialog.tsx'
    
    if (!fs.existsSync(formPath)) {
      console.error('❌ SubIndicatorFormDialog.tsx not found')
      return false
    }

    const formContent = fs.readFileSync(formPath, 'utf8')
    
    // Check for key features
    const hasFlexibleCriteria = formContent.includes('scoring_criteria')
    const hasAddButton = formContent.includes('addScoringCriterion')
    const hasRemoveButton = formContent.includes('removeScoringCriterion')
    const hasDynamicValidation = formContent.includes('scoring_criteria.length')

    console.log('✅ Form component features:')
    console.log(`   - Flexible criteria support: ${hasFlexibleCriteria ? '✅' : '❌'}`)
    console.log(`   - Add criteria button: ${hasAddButton ? '✅' : '❌'}`)
    console.log(`   - Remove criteria button: ${hasRemoveButton ? '✅' : '❌'}`)
    console.log(`   - Dynamic validation: ${hasDynamicValidation ? '✅' : '❌'}`)

    if (!hasFlexibleCriteria || !hasAddButton || !hasRemoveButton || !hasDynamicValidation) {
      console.error('❌ Form component missing required features')
      return false
    }

    console.log('\n🎉 All UI tests passed! Sub Indicator form with flexible criteria is ready.')
    
    console.log('\n📋 Manual Testing Instructions:')
    console.log('1. Open browser to: http://localhost:3000/kpi-config')
    console.log('2. Login as superadmin')
    console.log('3. Click on any indicator to expand')
    console.log('4. Click "Tambah Sub Indikator" button')
    console.log('5. In the form, scroll to "Kriteria Pengukuran Nilai/Skor" section')
    console.log('6. Try clicking "Tambah Kriteria" to add more than 5 criteria')
    console.log('7. Try removing criteria using the trash button')
    console.log('8. Fill in the form and save to test functionality')

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the test
testSubIndicatorFormUI()
  .then(success => {
    if (success) {
      console.log('\n✅ Sub Indicator Form UI test completed successfully!')
      console.log('\n🌐 Application is running at: http://localhost:3000')
      console.log('📝 You can now test the flexible criteria form manually in the browser.')
    } else {
      console.log('\n❌ UI test failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })