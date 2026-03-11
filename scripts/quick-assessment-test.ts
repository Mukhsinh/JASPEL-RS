// Quick test to verify assessment service exports
console.log('Testing assessment service exports...')

try {
  // Test dynamic import
  import('../lib/services/assessment.service').then(module => {
    console.log('✅ Assessment service imported successfully')
    console.log('Available exports:', Object.keys(module))
    
    // Test specific functions
    if (typeof module.getAvailablePeriods === 'function') {
      console.log('✅ getAvailablePeriods function found')
    } else {
      console.log('❌ getAvailablePeriods function missing')
    }
    
    if (typeof module.getAssessmentStatus === 'function') {
      console.log('✅ getAssessmentStatus function found')
    } else {
      console.log('❌ getAssessmentStatus function missing')
    }
    
    console.log('🎉 Assessment service test completed')
  }).catch(error => {
    console.error('❌ Import failed:', error)
  })
} catch (error) {
  console.error('❌ Test failed:', error)
}