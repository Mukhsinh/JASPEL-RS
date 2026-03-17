#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseLoginRedirectIssue() {
  console.log('🔍 Diagnosing login redirect issue...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Check the test user in auth.users
    console.log('\n1. Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }
    
    const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
    if (!testUser) {
      console.error('❌ Test user not found in auth.users')
      return
    }
    
    console.log('✅ Test user found in auth.users:')
    console.log('   - ID:', testUser.id)
    console.log('   - Email:', testUser.email)
    console.log('   - Email confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('   - User metadata:', JSON.stringify(testUser.user_metadata, null, 2))
    console.log('   - App metadata:', JSON.stringify(testUser.app_metadata, null, 2))

    // 2. Check the employee record
    console.log('\n2. Checking m_employees table...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Error fetching employee:', employeeError)
      return
    }
    
    if (!employee) {
      console.error('❌ Employee record not found')
      return
    }
    
    console.log('✅ Employee record found:')
    console.log('   - ID:', employee.id)
    console.log('   - Full name:', employee.full_name)
    console.log('   - Role:', employee.role)
    console.log('   - Is active:', employee.is_active)
    console.log('   - Unit ID:', employee.unit_id)
    console.log('   - User ID:', employee.user_id)

    // 3. Test authentication flow
    console.log('\n3. Testing authentication flow...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError)
      return
    }
    
    console.log('✅ Sign in successful:')
    console.log('   - Session exists:', !!signInData.session)
    console.log('   - User ID:', signInData.user?.id)
    console.log('   - Access token length:', signInData.session?.access_token?.length || 0)

    // 4. Check route permissions
    console.log('\n4. Checking route permissions...')
    const userRole = employee.role
    const routes = ['/dashboard', '/units', '/realization', '/profile']
    
    // Import route config (simulate middleware logic)
    const routeConfigs = [
      { path: '/dashboard', allowedRoles: ['superadmin', 'unit_manager', 'employee'] },
      { path: '/units', allowedRoles: ['superadmin'] },
      { path: '/realization', allowedRoles: ['unit_manager'] },
      { path: '/profile', allowedRoles: ['superadmin', 'unit_manager', 'employee'] }
    ]
    
    routes.forEach(route => {
      const config = routeConfigs.find(rc => rc.path === route)
      const allowed = config ? config.allowedRoles.includes(userRole as any) : true
      console.log(`   - ${route}: ${allowed ? '✅ Allowed' : '❌ Denied'} for role ${userRole}`)
    })

    // 5. Check expected redirect path
    console.log('\n5. Expected redirect path based on role:')
    let expectedPath = '/profile' // default
    switch (employee.role) {
      case 'superadmin':
        expectedPath = '/units'
        break
      case 'unit_manager':
        expectedPath = '/realization'
        break
      case 'employee':
        expectedPath = '/profile'
        break
    }
    console.log(`   - Role: ${employee.role}`)
    console.log(`   - Expected redirect: ${expectedPath}`)

    // 6. Test session persistence
    console.log('\n6. Testing session persistence...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session: persistedSession } } = await supabase.auth.getSession()
    console.log('   - Session persisted:', !!persistedSession)
    console.log('   - Session user ID:', persistedSession?.user?.id)

    console.log('\n✅ Diagnosis complete!')
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  }
}

diagnoseLoginRedirectIssue()