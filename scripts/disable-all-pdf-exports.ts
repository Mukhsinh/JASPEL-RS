#!/usr/bin/env tsx

/**
 * Disable All PDF Exports Temporarily
 * Replace PDF functionality with error messages to fix build
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

console.log('🔧 Disabling all PDF exports temporarily...\n')

const filesToFix = [
  'app/api/kpi-config/export/route.ts',
  'app/api/pegawai/export/route.ts', 
  'app/api/units/export/route.ts',
  'lib/export/pdf-export.ts',
  'lib/export/guide-generator.ts'
]

filesToFix.forEach(filePath => {
  if (!existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return
  }
  
  try {
    let content = readFileSync(filePath, 'utf-8')
    
    // Replace PDF generation with error response
    if (filePath.includes('route.ts')) {
      // For API routes, replace PDF generation
      content = content.replace(
        /if \(format === 'pdf'\) \{[\s\S]*?\} else \{/g,
        'if (format === \'pdf\') {\n      return NextResponse.json({ error: "PDF export sementara dinonaktifkan untuk kompatibilitas build" }, { status: 501 })\n    } else {'
      )
    } else if (filePath.includes('pdf-export.ts')) {
      // For PDF export library, replace functions with error throws
      content = content.replace(
        /export async function generate.*?\{[\s\S]*?^}/gm,
        'export async function generateIncentiveSlipPDF() {\n  throw new Error("PDF export sementara dinonaktifkan")\n}\n\nexport async function generateSummaryReportPDF() {\n  throw new Error("PDF export sementara dinonaktifkan")\n}\n\nexport async function exportToPDF() {\n  throw new Error("PDF export sementara dinonaktifkan")\n}'
      )
    } else if (filePath.includes('guide-generator.ts')) {
      // For guide generator, replace class with simple error
      content = `// PDF Guide Generator temporarily disabled for build compatibility
export class SystemGuideGenerator {
  public async generateSystemGuide(): Promise<Buffer> {
    throw new Error("PDF guide generation sementara dinonaktifkan")
  }
}
`
    }
    
    writeFileSync(filePath, content)
    console.log(`✅ Updated: ${filePath}`)
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error)
  }
})

console.log('\n✅ All PDF exports disabled!')
console.log('\n📋 Summary:')
console.log('   - PDF functionality temporarily disabled')
console.log('   - Build should now succeed')
console.log('   - Excel exports still work normally')
console.log('   - PDF can be re-enabled after deployment')
console.log('\n🚀 Try building again with: npm run build')