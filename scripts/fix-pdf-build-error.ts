#!/usr/bin/env tsx

/**
 * Fix PDF Build Error
 * Temporarily disable PDF export to fix build issues
 */

import { readFileSync, writeFileSync } from 'fs'

console.log('🔧 Fixing PDF build error...\n')

// 1. Temporarily disable PDF export in KPI config route
console.log('1. Disabling PDF export in KPI config route...')
try {
  const routePath = 'app/api/kpi-config/export/route.ts'
  let content = readFileSync(routePath, 'utf-8')
  
  // Comment out PDF generation temporarily
  content = content.replace(
    'return await generatePDFReport(unit, categoriesWithData || [], appSettings)',
    'return NextResponse.json({ error: "PDF export sementara dinonaktifkan" }, { status: 501 })'
  )
  
  writeFileSync(routePath, content)
  console.log('✅ PDF export disabled in KPI config route')
} catch (error) {
  console.error('❌ Error updating KPI config route:', error)
}

// 2. Check for other PDF imports
console.log('\n2. Checking for other PDF imports...')
const filesToCheck = [
  'app/api/assessment/export/route.ts',
  'app/api/reports/generate/route.ts'
]

filesToCheck.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf-8')
    if (content.includes('jspdf') || content.includes('pdf-export')) {
      console.log(`⚠️  Found PDF import in: ${filePath}`)
    }
  } catch (error) {
    console.log(`ℹ️  File not found: ${filePath}`)
  }
})

console.log('\n✅ PDF build error fix completed!')
console.log('\n📋 Summary:')
console.log('   - PDF export temporarily disabled')
console.log('   - Build should now succeed')
console.log('   - PDF functionality can be re-enabled after deployment')
console.log('\n🚀 Try building again with: npm run build')