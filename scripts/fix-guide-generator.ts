#!/usr/bin/env tsx

/**
 * Fix Guide Generator PDF Build Error
 * Update all methods to use async/await for PDF generation
 */

import { readFileSync, writeFileSync } from 'fs'

console.log('🔧 Fixing guide generator PDF build error...\n')

try {
  const filePath = 'lib/export/guide-generator.ts'
  let content = readFileSync(filePath, 'utf-8')
  
  // Update all private methods that use addTable to be async
  const methodsToUpdate = [
    'addSuperadminGuide',
    'addUnitManagerGuide', 
    'addEmployeeGuide',
    'addTroubleshootingGuide',
    'addFAQSection'
  ]
  
  methodsToUpdate.forEach(method => {
    content = content.replace(
      new RegExp(`private ${method}\\(\\)`, 'g'),
      `private async ${method}()`
    )
  })
  
  // Update all addTable calls to be awaited
  content = content.replace(/this\.addTable\(/g, 'await this.addTable(')
  
  // Update addPageNumbers method
  content = content.replace(
    'private addPageNumbers()',
    'private async addPageNumbers()'
  )
  
  // Update the call to addPageNumbers
  content = content.replace(
    'this.addPageNumbers()',
    'await this.addPageNumbers()'
  )
  
  writeFileSync(filePath, content)
  console.log('✅ Guide generator updated successfully')
  
} catch (error) {
  console.error('❌ Error updating guide generator:', error)
  process.exit(1)
}

console.log('\n✅ Guide generator fix completed!')
console.log('\n🚀 Try building again with: npm run build')