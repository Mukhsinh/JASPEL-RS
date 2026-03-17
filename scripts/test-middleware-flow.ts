#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function testMiddlewareFlow() {
  console.log('🔍 Testing middleware flow simulation...\n')
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 1. Simulate login
    console.log('1. Simulating login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful')
    
    // 2. Simulate middleware checks
    console.log('\n2. Simulating middleware checks...')
    
    // Check session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      console.error('❌ No session found')
      return
    }
    console.log('✅ Session check passed')
    
    // Check employee record
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('role, is_active, unit_id')
      .eq('user_id', sessionData.session.user.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee check failed:', empError.message)
      return
    }
    
    if (!employee.is_active) {
      console.error('❌ Employee is inactive')
      return
    }
    
    console.log('✅ Employee check passed')
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    
    // 3. Test route permissions
    console.log('\n3. Testing route permissions...')
    
    const routes = [
      { path: '/dashboard', role: 'all' },
      { path: '/units', role: 'superadmin' },
      { path: '/users', role: 'superadmin' },
      { path: '/kpi-config', role: 'superadmin' },
      { path: '/pool', role: 'superadmin' },
      { path: '/realization', role: 'unit_manager' },
      { path: '/assessment', role: 'superadmin' }
    ]
    
    for (const route of routes) {
      const hasAccess = route.role === 'all' || 
                       employee.role === 'superadmin' || 
                       employee.role === route.role
      
      const status = hasAccess ? '✅' : '❌'
      console.log(`   ${status} ${route.path} (required: ${route.role})`)
    }
    
    // 4. Test session refresh
    console.log('\n4. Testing session refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.error('❌ Session refresh failed:', refreshError.message)
    } else {
      console.log('✅ Session refresh successful')
      console.log('   New expires at:', new Date(refreshData.session?.expires_at! * 1000).toLocaleString())
    }
    
    // 5. Check for potential issues
    console.log('\n5. Checking for potential issues...')
    
    // Check if user has multiple employee records
    const { data: allEmployees, error: allEmpError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active')
      .eq('user_id', sessionData.session.user.id)
    
    if (allEmpError) {
      console.error('❌ Could not check for duplicate employees:', allEmpError.message)
    } else if (allEmployees.length > 1) {
      console.error('❌ Multiple employee records found for same user_id:')
      allEmployees.forEach(emp => {
        console.log(`   - ${emp.full_name} (${emp.role}) - Active: ${emp.is_active}`)
      })
    } else {
      console.log('✅ No duplicate employee records')
    }
    
    // Check user metadata consistency
    const userRole = sessionData.session.user.user_metadata?.role
    const employeeRole = employee.role
    
    if (userRole !== employeeRole) {
      console.error('❌ Role mismatch:')
      console.log(`   User metadata role: ${userRole}`)
      console.log(`   Employee table role: ${employeeRole}`)
    } else {
      console.log('✅ Role consistency check passed')
    }
    
    console.log('\n✅ Middleware flow simulation completed')
    console.log('\n💡 Jika login masih bermasalah, kemungkinan penyebabnya:')
    console.log('   1. Browser cache/storage yang korup')
    console.log('   2. Network connectivity issues')
    console.log('   3. Browser extension yang mengganggu')
    console.log('   4. Antivirus/firewall yang memblokir')
    
    // Clean up
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testMiddlewareFlow()