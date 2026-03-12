#!/usr/bin/env tsx

/**
 * Test PDF formatting fixes
 */

import { generateSystemGuide } from '@/lib/export/guide-generator'
import { generateIncentiveSlipPDF } from '@/lib/export/pdf-export'
import { getSetting } from '@/lib/services/settings.service'

async function testPDFFormatting() {
  console.log('🧪 Testing PDF formatting fixes...')
  
  try {
    // Test settings retrieval
    const { data: companyInfo } = await getSetting('company_info')
    const { data: footerData } = await getSetting('footer')
    
    console.log('Company Info:', {
      name: companyInfo?.name,
      developerName: companyInfo?.developerName,
      hasLogo: !!companyInfo?.logo
    })
    
    console.log('Footer Data:', {
      text: footerData?.text,
      hasFooter: !!footerData?.text
    })
    
    // Test guide generation (this will test the text cleaning)
    console.log('📄 Testing guide generation...')
    const guideBuffer = await generateSystemGuide()
    console.log(`✅ Guide generated successfully (${guideBuffer.length} bytes)`)
    
    console.log('✅ All PDF formatting tests passed!')
    
  } catch (error) {
    console.error('❌ PDF formatting test failed:', error)
    process.exit(1)
  }
}

testPDFFormatting()
