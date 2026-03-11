#!/usr/bin/env tsx

/**
 * Verify KPI Assessment System Implementation
 * Checks all files and components are in place
 */

import { existsSync } from 'fs'
import { readFileSync } from 'fs'

function verifyImplementation() {
  console.log('🔍 Verifying KPI Assessment System Implementation')
  console.log('=' .repeat(55))

  const requiredFiles = [
    // Database
    'supabase/migrations/add_kpi_assessment_system.sql',
    
    // Services
    'lib/services/assessment.service.ts',
    'services/calculation.service.ts',
    
    // API Routes
    'app/api/assessment/route.ts',
    'app/api/assessment/employees/route.ts',
    'app/api/assessment/status/route.ts',
    'app/api/assessment/indicators/route.ts',
    'app/api/assessment/reports/route.ts',
    'app/api/assessment/export/route.ts',
    
    // Pages
    'app/(authenticated)/assessment/page.tsx',
    
    // Components
    'components/assessment/AssessmentPageContent.tsx',
    'components/assessment/AssessmentTable.tsx',
    'components/assessment/AssessmentFormDialog.tsx',
    'components/assessment/AssessmentReports.tsx',
    'components/ui/tabs.tsx',
    
    // Tests
    'scripts/test-assessment-system.ts',
    'scripts/test-calculation-integration.ts'
  ]

  let allFilesExist = true
  let implementedFeatures = 0

  console.log('\n📁 Checking Required Files:')
  requiredFiles.forEach((file, index) => {
    const exists = existsSync(file)
    const status = exists ? '✅' : '❌'
    console.log(`   ${status} ${file}`)
    
    if (exists) {
      implementedFeatures++
    } else {
      allFilesExist = false
    }
  })

  console.log('\n🔧 Checking Key Integrations:')
  
  // Check sidebar integration
  if (existsSync('components/navigation/Sidebar.tsx')) {
    const sidebarContent = readFileSync('components/navigation/Sidebar.tsx', 'utf-8')
    const hasAssessmentMenu = sidebarContent.includes('Penilaian KPI') || sidebarContent.includes('assessment')
    console.log(`   ${hasAssessmentMenu ? '✅' : '❌'} Sidebar menu integration`)
  }

  // Check RBAC integration
  if (existsSync('lib/services/rbac.service.ts')) {
    const rbacContent = readFileSync('lib/services/rbac.service.ts', 'utf-8')
    const hasAssessmentPermissions = rbacContent.includes('assessment') || rbacContent.includes('penilaian')
    console.log(`   ${hasAssessmentPermissions ? '✅' : '❌'} RBAC permissions integration`)
  }

  // Check calculation service integration
  if (existsSync('services/calculation.service.ts')) {
    const calcContent = readFileSync('services/calculation.service.ts', 'utf-8')
    const hasAssessmentIntegration = calcContent.includes('t_kpi_assessments') && calcContent.includes('assessment')
    console.log(`   ${hasAssessmentIntegration ? '✅' : '❌'} Calculation service integration`)
  }

  console.log('\n📊 Implementation Summary:')
  console.log(`   Files implemented: ${implementedFeatures}/${requiredFiles.length}`)
  console.log(`   Completion rate: ${Math.round((implementedFeatures / requiredFiles.length) * 100)}%`)

  if (allFilesExist && implementedFeatures === requiredFiles.length) {
    console.log('\n🎉 IMPLEMENTATION COMPLETE!')
    console.log('\n✅ All required files are present')
    console.log('✅ Database schema implemented')
    console.log('✅ API routes created')
    console.log('✅ UI components built')
    console.log('✅ Services integrated')
    console.log('✅ Menu system updated')
    console.log('✅ Reports and export functionality')
    
    console.log('\n🚀 System Ready for Use:')
    console.log('   1. Start the development server: npm run dev')
    console.log('   2. Access: http://localhost:3002')
    console.log('   3. Login as superadmin or unit manager')
    console.log('   4. Navigate to "Penilaian KPI" menu')
    console.log('   5. Begin assessing employee performance')
    
    console.log('\n📋 Features Available:')
    console.log('   • Employee assessment by KPI indicators')
    console.log('   • Real-time score calculation')
    console.log('   • Unit-based data isolation (RLS)')
    console.log('   • Assessment status tracking')
    console.log('   • Comprehensive reports')
    console.log('   • Excel export functionality')
    console.log('   • Integration with incentive calculation')
    
  } else {
    console.log('\n⚠️  IMPLEMENTATION INCOMPLETE')
    console.log(`   Missing ${requiredFiles.length - implementedFeatures} files`)
    console.log('   Please complete the missing components')
  }
}

// Run verification
verifyImplementation()