#!/usr/bin/env tsx

/**
 * Test script for KPI Assessment System
 * Tests core functionality without requiring database connection
 */

import { calculateAchievementPercentage, calculateScore, validateAssessmentInput } from '../lib/services/assessment.service'

console.log('🧪 Testing KPI Assessment System Core Functions...\n')

// Test 1: Achievement Percentage Calculation
console.log('1. Testing Achievement Percentage Calculation:')
const testCases = [
  { realization: 100, target: 100, expected: 100 },
  { realization: 80, target: 100, expected: 80 },
  { realization: 120, target: 100, expected: 120 },
  { realization: 0, target: 100, expected: 0 },
  { realization: 50, target: 0, expected: 0 }, // Edge case: zero target
]

testCases.forEach((test, index) => {
  const result = calculateAchievementPercentage(test.realization, test.target)
  const passed = Math.abs(result - test.expected) < 0.01
  console.log(`  Test ${index + 1}: ${test.realization}/${test.target} = ${result.toFixed(2)}% ${passed ? '✅' : '❌'}`)
})

// Test 2: Score Calculation
console.log('\n2. Testing Score Calculation:')
const scoreTests = [
  { achievement: 100, expected: 100 },
  { achievement: 80, expected: 80 },
  { achievement: 120, expected: 100 }, // Should cap at 100
  { achievement: 0, expected: 0 },
  { achievement: -10, expected: 0 }, // Should not go below 0
]

scoreTests.forEach((test, index) => {
  const result = calculateScore(test.achievement)
  const passed = result === test.expected
  console.log(`  Test ${index + 1}: ${test.achievement}% → ${result} ${passed ? '✅' : '❌'}`)
})

// Test 3: Input Validation
console.log('\n3. Testing Input Validation:')

// Valid input
const validInput = {
  employee_id: 'test-employee-id',
  indicator_id: 'test-indicator-id',
  period: '2024-03',
  realization_value: 85.5,
  target_value: 100,
  weight_percentage: 25,
  assessor_id: 'test-assessor-id'
}

const validResult = validateAssessmentInput(validInput)
console.log(`  Valid input: ${validResult.isValid ? '✅' : '❌'}`)
if (!validResult.isValid) {
  console.log(`    Errors: ${validResult.errors.join(', ')}`)
}

// Invalid inputs
const invalidInputs = [
  { ...validInput, employee_id: '', name: 'Missing employee_id' },
  { ...validInput, period: '2024-3', name: 'Invalid period format' },
  { ...validInput, realization_value: -10, name: 'Negative realization' },
  { ...validInput, target_value: 0, name: 'Zero target value' },
  { ...validInput, weight_percentage: 150, name: 'Invalid weight percentage' },
]

invalidInputs.forEach((test, index) => {
  const result = validateAssessmentInput(test)
  console.log(`  ${test.name}: ${!result.isValid ? '✅' : '❌'}`)
  if (result.isValid) {
    console.log(`    Expected validation to fail but it passed`)
  }
})

// Test 4: Component Structure Verification
console.log('\n4. Testing Component Structure:')

try {
  // Check if key files exist
  const fs = require('fs')
  const path = require('path')
  
  const requiredFiles = [
    'lib/services/assessment.service.ts',
    'app/api/assessment/route.ts',
    'app/api/assessment/employees/route.ts',
    'app/api/assessment/status/route.ts',
    'app/api/assessment/indicators/route.ts',
    'app/(authenticated)/assessment/page.tsx',
    'components/assessment/AssessmentPageContent.tsx',
    'components/assessment/AssessmentTable.tsx',
    'components/assessment/AssessmentFormDialog.tsx',
    'supabase/migrations/add_kpi_assessment_system.sql'
  ]
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file))
    console.log(`  ${file}: ${exists ? '✅' : '❌'}`)
  })
  
} catch (error) {
  console.log('  File structure check failed:', error)
}

// Test 5: RBAC Integration Check
console.log('\n5. Testing RBAC Integration:')

try {
  const rbacContent = require('fs').readFileSync('lib/services/rbac.service.ts', 'utf8')
  
  const checks = [
    { test: 'assessment:read permission', pattern: /assessment:read/ },
    { test: 'assessment:create permission', pattern: /assessment:create/ },
    { test: 'assessment:update permission', pattern: /assessment:update/ },
    { test: 'ClipboardCheck icon', pattern: /ClipboardCheck/ },
    { test: 'assessment menu item', pattern: /Penilaian KPI/ },
    { test: 'assessment route', pattern: /\/assessment/ },
  ]
  
  checks.forEach(check => {
    const found = check.pattern.test(rbacContent)
    console.log(`  ${check.test}: ${found ? '✅' : '❌'}`)
  })
  
} catch (error) {
  console.log('  RBAC integration check failed:', error)
}

console.log('\n🎉 Assessment System Core Tests Complete!')
console.log('\n📝 Next Steps:')
console.log('  1. Start Docker Desktop')
console.log('  2. Run: npm run dev')
console.log('  3. Apply migration: npx supabase db reset --local')
console.log('  4. Test in browser at /assessment')
console.log('  5. Verify menu appears for unit_manager and superadmin roles')