#!/usr/bin/env tsx

/**
 * Test script untuk memverifikasi perbaikan format PDF
 * Menguji format teks dalam kotak, nama pengembang, dan footer
 */

import { createClient } from '@/lib/supabase/server'
import { generateSystemGuide } from '@/lib/export/guide-generator'
import { generateIncentiveSlipPDF, generateSummaryReportPDF, exportToPDF } from '@/lib/export/pdf-export'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function testPDFFormatting() {
  console.log('🧪 Testing PDF formatting fixes...')
  
  try {
    const supabase = createClient()
    
    // Test 1: Generate system guide with fixed text formatting
    console.log('\n1. Testing system guide generation...')
    const guideBuffer = await generateSystemGuide()
    
    if (guideBuffer && guideBuffer.length > 0) {
      const guidePath = join(process.cwd(), 'test-output', 'system-guide-fixed.pdf')
      writeFileSync(guidePath, guideBuffer)
      console.log('✅ System guide generated successfully')
      console.log(`   📄 Saved to: ${guidePath}`)
    } else {
      console.log('❌ Failed to generate system guide')
    }
    
    // Test 2: Test incentive slip with developer name and footer
    console.log('\n2. Testing incentive slip generation...')
    const mockSlipData = {
      period: '2024-01',
      employeeCode: 'EMP001',
      employeeName: 'John Doe',
      unit: 'IT Department',
      taxStatus: 'TK/0',
      p1Score: 85,
      p2Score: 90,
      p3Score: 88,
      p1Weighted: 25.5,
      p2Weighted: 45.0,
      p3Weighted: 17.6,
      finalScore: 88.1,
      grossIncentive: 5000000,
      taxAmount: 250000,
      netIncentive: 4750000,
      indicators: [
        {
          category: 'P1',
          name: 'Kehadiran',
          target: 100,
          realization: 95,
          achievement: 95,
          score: 95
        }
      ]
    }
    
    // Generate incentive slip (this will save automatically)
    await generateIncentiveSlipPDF(mockSlipData)
    console.log('✅ Incentive slip generated successfully')
    
    // Test 3: Test summary report
    console.log('\n3. Testing summary report generation...')
    const mockSummaryData = [
      {
        employeeCode: 'EMP001',
        employeeName: 'John Doe',
        unit: 'IT Department',
        finalScore: 88.1,
        grossIncentive: 5000000,
        taxAmount: 250000,
        netIncentive: 4750000
      },
      {
        employeeCode: 'EMP002',
        employeeName: 'Jane Smith',
        unit: 'HR Department',
        finalScore: 92.5,
        grossIncentive: 5500000,
        taxAmount: 275000,
        netIncentive: 5225000
      }
    ]
    
    // Generate summary report (this will save automatically)
    await generateSummaryReportPDF(mockSummaryData, '2024-01')
    console.log('✅ Summary report generated successfully')
    
    // Test 4: Test export to PDF function
    console.log('\n4. Testing export to PDF function...')
    const exportBuffer = await exportToPDF({
      reportType: 'incentive',
      period: '2024-01',
      data: mockSummaryData
    })
    
    if (exportBuffer && exportBuffer.length > 0) {
      const exportPath = join(process.cwd(), 'test-output', 'export-test-fixed.pdf')
      writeFileSync(exportPath, exportBuffer)
      console.log('✅ Export PDF generated successfully')
      console.log(`   📄 Saved to: ${exportPath}`)
    } else {
      console.log('❌ Failed to generate export PDF')
    }
    
    // Test 5: Verify settings are properly loaded
    console.log('\n5. Testing settings integration...')
    const { getSetting } = await import('@/lib/services/settings.service')
    
    const { data: companyInfo } = await getSetting('company_info')
    const { data: footerData } = await getSetting('footer')
    
    console.log('📋 Current settings:')
    console.log(`   Company Name: ${companyInfo?.name || 'Not set'}`)
    console.log(`   Developer Name: ${companyInfo?.developerName || 'Not set'}`)
    console.log(`   Footer Text: ${footerData?.text || 'Not set'}`)
    
    if (!companyInfo?.developerName) {
      console.log('⚠️  Warning: Developer name not set in settings')
      console.log('   Go to Settings page to add developer name')
    }
    
    if (!footerData?.text) {
      console.log('⚠️  Warning: Footer text not set in settings')
      console.log('   Go to Settings page to add footer text')
    }
    
    console.log('\n✅ All PDF formatting tests completed!')
    console.log('\n📝 Fixes applied:')
    console.log('   • Cleaned text formatting in info/warning boxes')
    console.log('   • Added fallback for developer name display')
    console.log('   • Ensured footer text appears from settings')
    console.log('   • Improved text readability in colored boxes')
    
    console.log('\n🔍 Check the generated PDF files to verify:')
    console.log('   1. Text in blue/yellow boxes is clean and readable')
    console.log('   2. Developer name appears on cover page and headers')
    console.log('   3. Footer text appears at bottom of pages')
    console.log('   4. No strange characters or formatting codes')
    
  } catch (error) {
    console.error('❌ Error testing PDF formatting:', error)
    process.exit(1)
  }
}

// Run the test
testPDFFormatting()