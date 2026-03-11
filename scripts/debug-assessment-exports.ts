// Debug assessment service exports
console.log('Debugging assessment service exports...')

async function debugExports() {
  try {
    // Test file existence
    const fs = await import('fs')
    const path = './lib/services/assessment.service.ts'
    
    if (fs.existsSync(path)) {
      console.log('✅ Assessment service file exists')
      
      // Read file content
      const content = fs.readFileSync(path, 'utf8')
      console.log('File content length:', content.length)
      
      // Check for export statements
      const exportMatches = content.match(/export\s+(async\s+)?function\s+\w+/g)
      console.log('Export functions found:', exportMatches)
      
      // Check for specific functions
      const hasGetAvailablePeriods = content.includes('export async function getAvailablePeriods')
      const hasGetAssessmentStatus = content.includes('export async function getAssessmentStatus')
      
      console.log('Has getAvailablePeriods export:', hasGetAvailablePeriods)
      console.log('Has getAssessmentStatus export:', hasGetAssessmentStatus)
      
    } else {
      console.log('❌ Assessment service file does not exist')
    }
    
    // Test dynamic import
    const module = await import('../lib/services/assessment.service')
    console.log('Module keys:', Object.keys(module))
    console.log('Module default:', typeof module.default)
    
    // Test specific imports
    const { getAvailablePeriods } = module
    console.log('getAvailablePeriods type:', typeof getAvailablePeriods)
    
  } catch (error) {
    console.error('Debug failed:', error)
  }
}

debugExports()