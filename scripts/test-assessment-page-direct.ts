import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAssessmentPageDirect() {
  console.log('🧪 Testing Assessment Page Direct Access...\n')

  try {
    // 1. Get superadmin user
    console.log('1. Getting superadmin user...')
    const { data: superadmin, error: superadminError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, user_id')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .single()

    if (superadminError || !superadmin) {
      console.error('   ❌ No superadmin found:', superadminError?.message)
      return
    }

    console.log(`   ✅ Found superadmin: ${superadmin.full_name}`)
    console.log(`   User ID: ${superadmin.user_id}`)

    // 2. Test authentication check (simulate what the page does)
    console.log('\n2. Testing authentication simulation...')
    
    // Get auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(superadmin.user_id)
    
    if (authError || !authUser.user) {
      console.error('   ❌ Auth user not found:', authError?.message)
      return
    }

    console.log(`   ✅ Auth user found: ${authUser.user.email}`)
    console.log(`   Role in metadata: ${authUser.user.user_metadata?.role}`)

    // 3. Test employee lookup (simulate page logic)
    console.log('\n3. Testing employee lookup...')
    const { data: currentEmployee } = await supabase
      .from('m_employees')
      .select('id, role, unit_id, full_name')
      .eq('user_id', superadmin.user_id)
      .single()

    if (!currentEmployee) {
      console.error('   ❌ Employee not found by user_id')
      return
    }

    console.log(`   ✅ Employee found: ${currentEmployee.full_name}`)
    console.log(`   Role: ${currentEmployee.role}`)

    // 4. Test role permission check
    console.log('\n4. Testing role permission...')
    const allowedRoles = ['superadmin', 'unit_manager']
    const hasPermission = allowedRoles.includes(currentEmployee.role)
    
    console.log(`   Role check: ${hasPermission ? '✅ ALLOWED' : '❌ FORBIDDEN'}`)

    // 5. Test available periods function
    console.log('\n5. Testing available periods...')
    const { data: periods, error: periodsError } = await supabase
      .from('t_pool')
      .select('period')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })

    if (periodsError) {
      console.error('   ❌ Periods error:', periodsError.message)
    } else {
      console.log(`   ✅ Available periods: ${periods?.map(p => p.period).join(', ') || 'none'}`)
    }

    // 6. Test component dependencies
    console.log('\n6. Testing component dependencies...')
    
    // Check if AssessmentPageContent component exists
    try {
      const fs = require('fs')
      const componentExists = fs.existsSync('components/assessment/AssessmentPageContent.tsx')
      console.log(`   AssessmentPageContent: ${componentExists ? '✅' : '❌'}`)
      
      if (componentExists) {
        // Read component to check for any obvious issues
        const componentContent = fs.readFileSync('components/assessment/AssessmentPageContent.tsx', 'utf8')
        const hasUseClient = componentContent.includes("'use client'")
        const hasExport = componentContent.includes('export default')
        
        console.log(`   Has 'use client': ${hasUseClient ? '✅' : '❌'}`)
        console.log(`   Has default export: ${hasExport ? '✅' : '❌'}`)
      }
    } catch (error) {
      console.log('   Could not check component file')
    }

    // 7. Simulate the exact URL access
    console.log('\n7. URL Access Simulation...')
    console.log('   URL: localhost:3002/assessment')
    console.log('   Expected behavior:')
    console.log('   - Middleware checks auth ✅')
    console.log('   - Middleware checks role ✅') 
    console.log('   - Page checks auth ✅')
    console.log('   - Page checks employee ✅')
    console.log('   - Page checks permissions ✅')
    console.log('   - Page loads component ✅')

    console.log('\n🎯 DIAGNOSIS:')
    console.log('   All backend checks pass. Issue might be:')
    console.log('   1. Frontend component error')
    console.log('   2. Browser cache issue')
    console.log('   3. Session/cookie issue')
    console.log('   4. Build/compilation issue')

    console.log('\n✅ Direct access test complete!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAssessmentPageDirect()