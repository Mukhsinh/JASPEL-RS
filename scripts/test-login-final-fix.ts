/**
 * Final test after all fixes
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginFinalFix() {
  console.log('🎯 FINAL LOGIN TEST AFTER ALL FIXES\n')
  console.log('=' .repeat(60))

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test 1: Login
    console.log('\n1️⃣ TESTING LOGIN')
    console.log('-'.repeat(60))
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user || !authData.session) {
      console.error('❌ Login failed:', authError?.message)
      return
    }

    console.log('✅ Login successful')
    console.log('   User:', authData.user.email)
    console.log('   Role:', authData.user.user_metadata?.role)

    // Test 2: Fetch employee
    console.log('\n2️⃣ FETCHING EMPLOYEE DATA')
    console.log('-'.repeat(60))
    
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id, m_units(name)')
      .eq('user_id', authData.user.id)
      .single()
    
    if (empError || !employee) {
      console.error('❌ Employee fetch failed:', empError?.message)
      return
    }

    console.log('✅ Employee data fetched')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    console.log('   Unit:', employee.m_units?.name)

    // Test 3: Verify all conditions for middleware
    console.log('\n3️⃣ VERIFYING MIDDLEWARE CONDITIONS')
    console.log('-'.repeat(60))
    
    const checks = [
      { name: 'Session exists', pass: !!authData.session },
      { name: 'User exists', pass: !!authData.user },
      { name: 'Role in metadata', pass: !!authData.user.user_metadata?.role },
      { name: 'Employee record exists', pass: !!employee },
      { name: 'Employee is active', pass: employee.is_active },
      { name: 'Role matches', pass: employee.role === authData.user.user_metadata?.role },
    ]

    let allPass = true
    checks.forEach(check => {
      const status = check.pass ? '✅' : '❌'
      console.log(`   ${status} ${check.name}`)
      if (!check.pass) allPass = false
    })

    if (allPass) {
      console.log('\n✅ ALL CHECKS PASSED!')
      console.log('   User should be able to access dashboard')
    } else {
      console.log('\n❌ SOME CHECKS FAILED')
      console.log('   User will be redirected to login')
    }

    // Clean up
    await supabase.auth.signOut()

    console.log('\n' + '='.repeat(60))
    console.log('✅ TEST COMPLETE')
    console.log('='.repeat(60))
    console.log('\nFixes applied:')
    console.log('1. Removed custom storage adapter from client')
    console.log('2. Removed signOut before login')
    console.log('3. Simplified auth error handler')
    console.log('4. Removed duplicate auth listeners')
    console.log('\nNext step: Test in browser at http://localhost:3000/login')

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message)
  }
}

testLoginFinalFix()
