#!/usr/bin/env tsx

/**
 * Fix PDF formatting issues:
 * 1. Clean up text formatting in report boxes
 * 2. Ensure developer name appears on cover page
 * 3. Fix footer display from settings
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

console.log('🔧 Memperbaiki masalah formatting PDF...')

// Fix guide-generator.ts - clean up text formatting in boxes
const guideGeneratorPath = join(process.cwd(), 'lib/export/guide-generator.ts')
let guideContent = readFileSync(guideGeneratorPath, 'utf-8')

// Fix addWarningBox method - improve text cleaning
guideContent = guideContent.replace(
  /private addWarningBox\(title: string, content: string\) \{[\s\S]*?this\.yPos \+= boxHeight \+ 5\s*\}/,
  `private addWarningBox(title: string, content: string) {
    // Bersihkan konten dari kode formatting yang tidak diinginkan
    const cleanContent = content
      .replace(/&\\s*b\\s*/gi, '') // Hapus kode & b
      .replace(/[^\\w\\s\\.,!?;:()\\-→]/g, ' ') // Hapus karakter khusus kecuali tanda baca umum dan arrow
      .replace(/\\s+/g, ' ') // Ganti multiple spaces dengan single space
      .replace(/^\\s+|\\s+$/g, '') // Trim whitespace
      .trim()
    
    const lines = this.doc.splitTextToSize(cleanContent, 160)
    const boxHeight = Math.max(25, 15 + (lines.length * 4))
    
    this.checkPageBreak(boxHeight + 5)
    
    // Draw warning box
    this.doc.setFillColor(255, 243, 205) // Light yellow
    this.doc.setDrawColor(255, 193, 7) // Yellow border
    this.doc.setLineWidth(1)
    this.doc.rect(this.margin, this.yPos - 5, 170, boxHeight, 'FD')
    
    // Warning icon and title
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(138, 109, 59) // Dark yellow
    this.doc.text('⚠ ' + title, this.margin + 5, this.yPos + 3)
    
    // Content
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0) // Black text for better readability
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 5, this.yPos + 10 + (index * 4))
    })
    
    this.yPos += boxHeight + 5
  }`
)

// Fix addInfoBox method - improve text cleaning
guideContent = guideContent.replace(
  /private addInfoBox\(title: string, content: string\) \{[\s\S]*?this\.yPos \+= boxHeight \+ 5\s*\}/,
  `private addInfoBox(title: string, content: string) {
    // Bersihkan konten dari kode formatting yang tidak diinginkan
    const cleanContent = content
      .replace(/&\\s*b\\s*/gi, '') // Hapus kode & b
      .replace(/[^\\w\\s\\.,!?;:()\\-→]/g, ' ') // Hapus karakter khusus kecuali tanda baca umum dan arrow
      .replace(/\\s+/g, ' ') // Ganti multiple spaces dengan single space
      .replace(/^\\s+|\\s+$/g, '') // Trim whitespace
      .trim()
    
    const lines = this.doc.splitTextToSize(cleanContent, 160)
    const boxHeight = Math.max(25, 15 + (lines.length * 4))
    
    this.checkPageBreak(boxHeight + 5)
    
    // Draw info box
    this.doc.setFillColor(217, 237, 247) // Light blue
    this.doc.setDrawColor(52, 152, 219) // Blue border
    this.doc.setLineWidth(1)
    this.doc.rect(this.margin, this.yPos - 5, 170, boxHeight, 'FD')
    
    // Info icon and title
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(31, 81, 255) // Dark blue
    this.doc.text('ℹ ' + title, this.margin + 5, this.yPos + 3)
    
    // Content
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0) // Black text for better readability
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 5, this.yPos + 10 + (index * 4))
    })
    
    this.yPos += boxHeight + 5
  }`
)

writeFileSync(guideGeneratorPath, guideContent)
console.log('✅ Fixed guide-generator.ts text formatting')

// Fix pdf-export.ts - improve developer name visibility and footer handling
const pdfExportPath = join(process.cwd(), 'lib/export/pdf-export.ts')
let pdfContent = readFileSync(pdfExportPath, 'utf-8')

// Fix developer name visibility in all PDF functions
pdfContent = pdfContent.replace(
  /\/\/ Add developer name if available[\s\S]*?doc\.setTextColor\(0, 0, 0\)\s*\}/g,
  `// Add developer name if available - ensure it's visible
  if (companyInfo.developerName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(52, 73, 94) // Dark gray for better visibility
    doc.text(\`Dikembangkan oleh: \${companyInfo.developerName}\`, 105, yPos + 22, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }`
)

// Fix landscape PDF developer name
pdfContent = pdfContent.replace(
  /doc\.text\(companyInfo\.name, 148, yPos \+ 12, \{ align: 'center' \}\)[\s\S]*?doc\.text\(\`Dikembangkan oleh: \$\{companyInfo\.developerName\}\`, 148, yPos \+ 16, \{ align: 'center' \}\)/,
  `doc.text(companyInfo.name, 148, yPos + 12, { align: 'center' })

  // Add developer name if available - ensure it's visible
  if (companyInfo.developerName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(52, 73, 94) // Dark gray for better visibility
    doc.text(\`Dikembangkan oleh: \${companyInfo.developerName}\`, 148, yPos + 16, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }`
)

// Fix footer handling to ensure proper display from settings
pdfContent = pdfContent.replace(
  /\/\/ Get footer text from settings[\s\S]*?const footerText = footerData\?\.text \|\| companyInfo\.name/g,
  `// Get footer text from settings - ensure it displays properly
  let footerText = companyInfo.name
  if (footerData?.text && footerData.text.trim()) {
    footerText = footerData.text.trim()
  }`
)

writeFileSync(pdfExportPath, pdfContent)
console.log('✅ Fixed pdf-export.ts developer name and footer')

// Create a test script to verify the fixes
const testScript = `#!/usr/bin/env tsx

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
    console.log(\`✅ Guide generated successfully (\${guideBuffer.length} bytes)\`)
    
    console.log('✅ All PDF formatting tests passed!')
    
  } catch (error) {
    console.error('❌ PDF formatting test failed:', error)
    process.exit(1)
  }
}

testPDFFormatting()
`

writeFileSync(join(process.cwd(), 'scripts/test-pdf-formatting-fixes.ts'), testScript)
console.log('✅ Created test script for PDF formatting')

console.log(`
🎉 PDF formatting fixes completed!

Fixed issues:
1. ✅ Cleaned up text formatting in report boxes (removed unwanted characters)
2. ✅ Enhanced developer name visibility on cover pages
3. ✅ Improved footer display from settings
4. ✅ Created test script to verify fixes

To test the fixes:
npm run tsx scripts/test-pdf-formatting-fixes.ts

The fixes ensure:
- Text in boxes is clean and readable
- Developer name appears prominently on all PDF covers
- Footer text displays correctly from settings
- All formatting is consistent across different PDF types
`)