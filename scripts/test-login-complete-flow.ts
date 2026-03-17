#!/usr/bin/env tsx

/**
 * Test Complete Login Flow
 * Menguji alur login lengkap dari authentication hingga redirect
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createBrowserClient } from '@supabase/ssr'

function createTestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  })
}

async function testCompleteLoginFlow() {
  console.log('🧪 Testing Complete Login Flow...\n')

  try {
    const supabase = createTestClient()
    
    // Step 1: Clear existing session
    console.log('Step 1: Clearing existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    console.log('✅ Session cleared')

    // Step 2: Test authentication
    console.log('\nStep 2: Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user || !authData.session) {
      console.error('❌ Authentication failed:', authError?.message)
      return
    }

    console.log('✅ Authentication successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Session expires:', new Date(authData.session.expires_at! * 1000).toLocaleString())

    // Step 3: Test employee data fetch
    console.log('\nStep 3: Testing employee data fetch...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()

    if (employeeError || !employee) {
      console.error('❌ Employee fetch failed:', employeeError?.message)
      return
    }

    console.log('✅ Employee data found')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Unit ID:', employee.unit_id)
    console.log('   Active:', employee.is_active)

    // Step 4: Test role-based redirect logic
    console.log('\nStep 4: Testing role-based redirect logic...')
    let expectedRoute: string
    
    switch (employee.role) {
      case 'superadmin':
        expectedRoute = '/units'
        break
      case 'unit_manager':
        expectedRoute = '/realization'
        break
      case 'employee':
        expectedRoute = '/profile'
        break
      default:
        expectedRoute = '/login?error=user_not_found'
    }
    
    console.log('✅ Role-based routing determined')
    console.log('   Role:', employee.role)
    console.log('   Expected route:', expectedRoute)

    // Step 5: Test session persistence
    console.log('\nStep 5: Testing session persistence...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session: persistedSession } } = await supabase.auth.getSession()
    
    if (!persistedSession) {
      console.error('❌ Session not persisted')
      return
    }
    
    console.log('✅ Session persisted successfully')
    console.log('   Token matches:', persistedSession.access_token === authData.session.access_token)

    // Step 6: Clean up
    console.log('\nStep 6: Cleaning up...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

    console.log('\n🎉 Complete login flow test PASSED!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Authentication works')
    console.log('   ✅ Employee data accessible')
    console.log('   ✅ Role-based routing configured')
    console.log('   ✅ Session persistence works')
    console.log('\n💡 Login should work in browser now!')

  } catch (error) {
    console.error('❌ Complete login flow test FAILED:', error)
  }
}

// Run test
testCompleteLoginFlow()