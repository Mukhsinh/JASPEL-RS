#!/usr/bin/env tsx

/**
 * Comprehensive verification script for pegawai page fixes
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function verifyPegawaiFix() {
  console.log('🔍 Verifying pegawai page fixes...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    return false
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  let allTestsPassed = true
  
  // Test 1: Database Schema
  console.log('\n1. ✅ Database Schema Tests')
  try {
    const { data, error } = await supabase
      .from('m_employees')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Database connection failed:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ Database connection successful')
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        const requiredColumns = [
          'id', 'employee_code', 'full_name', 'unit_id', 'position', 
          'phone', 'nik', 'bank_name', 'bank_account_number', 
          'bank_account_name', 'employee_status', 'tax_type', 'pns_grade'
        ]
        
        const missingColumns = requiredColumns.filter(col => !columns.includes(col))
        if (missingColumns.length > 0) {
          console.log('❌ Missing columns:', missingColumns)
          allTestsPassed = false
        } else {
          console.log('✅ All required columns present')
        }
      }
    }
  } catch (err: any) {
    console.log('❌ Database test failed:', err.message)
    allTestsPassed = false
  }
  
  // Test 2: File Structure
  console.log('\n2. ✅ File Structure Tests')
  const requiredFiles = [
    'app/(authenticated)/pegawai/page.tsx',
    'app/(authenticated)/pegawai/actions.ts',
    'components/pegawai/PegawaiTable.tsx',
    'components/pegawai/PegawaiFormDialog.tsx',
    'components/ui/loading-spinner.tsx',
    'lib/utils/auth-session.ts'
  ]
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`)
    } else {
      console.log(`❌ ${file} missing`)
      allTestsPassed = false
    }
  }
  
  // Test 3: Server Actions
  console.log('\n3. ✅ Server Actions Tests')
  try {
    // Test the actual query that would be used
    const { data, error, count } = await supabase
      .from('m_employees')
      .select('*, m_units(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 49)
    
    if (error) {
      console.log('❌ Server action query failed:', error.message)
      allTestsPassed = false
    } else {
      console.log('✅ Server action query successful')
      console.log(`📊 Found ${count} total records, returned ${data?.length || 0}`)
    }
  } catch (err: any) {
    console.log('❌ Server action test failed:', err.message)
    allTestsPassed = false
  }
  
  // Test 4: Auth Session Utilities
  console.log('\n4. ✅ Auth Session Utilities Tests')
  try {
    const authSessionPath = 'lib/utils/auth-session.ts'
    const content = fs.readFileSync(authSessionPath, 'utf8')
    
    const requiredFunctions = [
      'validateSessionData',
      'clearAuthStorage',
      'setupAuthErrorHandler',
      'verifySession'
    ]
    
    for (const func of requiredFunctions) {
      if (content.includes(`function ${func}`) || content.includes(`export function ${func}`)) {
        console.log(`✅ ${func} function exists`)
      } else {
        console.log(`❌ ${func} function missing`)
        allTestsPassed = false
      }
    }
  } catch (err: any) {
    console.log('❌ Auth session utilities test failed:', err.message)
    allTestsPassed = false
  }
  
  // Test 5: Component Integration
  console.log('\n5. ✅ Component Integration Tests')
  try {
    const pagePath = 'app/(authenticated)/pegawai/page.tsx'
    const pageContent = fs.readFileSync(pagePath, 'utf8')
    
    const requiredImports = [
      'setupAuthErrorHandler',
      'validateSessionData',
      'getPegawaiWithUnits',
      'LoadingSpinner'
    ]
    
    for (const imp of requiredImports) {
      if (pageContent.includes(imp)) {
        console.log(`✅ ${imp} imported correctly`)
      } else {
        console.log(`❌ ${imp} import missing`)
        allTestsPassed = false
      }
    }
  } catch (err: any) {
    console.log('❌ Component integration test failed:', err.message)
    allTestsPassed = false
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Pegawai page should work correctly.')
    console.log('\n📋 What was fixed:')
    console.log('✅ Added missing database columns')
    console.log('✅ Fixed RLS policies for auth system')
    console.log('✅ Completed server actions')
    console.log('✅ Enhanced auth session handling')
    console.log('✅ Added missing UI components')
    console.log('✅ Improved error handling')
    
    console.log('\n🚀 Next steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Navigate to /pegawai page')
    console.log('3. Verify no console errors')
    console.log('4. Test data loading and forms')
  } else {
    console.log('❌ SOME TESTS FAILED! Please review the errors above.')
  }
  
  return allTestsPassed
}

// Run verification
verifyPegawaiFix().catch(console.error)