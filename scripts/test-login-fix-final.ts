#!/usr/bin/env tsx

/**
 * Test script to verify login fix
 * Tests the complete login flow with the updated auth service
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testLoginFix() {
  console.log('🔍 Testing login fix...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Check user exists in auth.users
    console.log('\n1. Checking user in auth.users...')
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
    
    console.log('✅ User found in auth.users')
    console.log('   - ID:', testUser.id)
    console.log('   - Email:', testUser.email)
    console.log('   - raw_user_meta_data:', testUser.raw_user_meta_data)
    console.log('   - user_metadata:', testUser.user_metadata)

    // 2. Check employee record
    console.log('\n2. Checking employee record...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, unit_id, is_active, user_id')
      .eq('user_id', testUser.id)
      .single()
    
    if (empError || !employee) {
      console.error('❌ Employee record not found:', empError)
      return
    }
    
    console.log('✅ Employee record found')
    console.log('   - ID:', employee.id)
    console.log('   - Name:', employee.full_name)
    console.log('   - Role:', employee.role)
    console.log('   - Unit ID:', employee.unit_id)
    console.log('   - Active:', employee.is_active)
    console.log('   - User ID:', employee.user_id)

    // 3. Test role resolution logic
    console.log('\n3. Testing role resolution logic...')
    const roleFromEmployee = employee.role
    const roleFromMetadata = testUser.raw_user_meta_data?.role || testUser.user_metadata?.role
    
    console.log('   - Role from employee table:', roleFromEmployee)
    console.log('   - Role from metadata:', roleFromMetadata)
    
    const finalRole = roleFromEmployee || roleFromMetadata
    console.log('   - Final role (employee || metadata):', finalRole)
    
    if (!finalRole) {
      console.error('❌ No role found in either source')
      return
    }
    
    console.log('✅ Role resolution successful')

    // 4. Test login simulation
    console.log('\n4. Testing login simulation...')
    
    // Simulate what happens in auth service
    const mockAuthData = {
      user: testUser,
      session: { user: testUser }
    }
    
    // Test employee fetch (what auth service does)
    const { data: employeeForAuth, error: authEmpError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active, role')
      .eq('user_id', testUser.id)
      .single()
    
    if (authEmpError || !employeeForAuth) {
      console.error('❌ Auth service employee fetch would fail:', authEmpError)
      return
    }
    
    const authRole = employeeForAuth.role || 
                     testUser.raw_user_meta_data?.role || 
                     testUser.user_metadata?.role
    
    if (!authRole) {
      console.error('❌ Auth service role resolution would fail')
      return
    }
    
    if (!employeeForAuth.is_active) {
      console.error('❌ Employee is inactive')
      return
    }
    
    console.log('✅ Auth service simulation successful')
    console.log('   - Would return role:', authRole)
    console.log('   - Employee active:', employeeForAuth.is_active)

    // 5. Test middleware simulation
    console.log('\n5. Testing middleware simulation...')
    
    // Simulate what middleware does
    const { data: empForMiddleware, error: midEmpError } = await supabase
      .from('m_employees')
      .select('role, is_active')
      .eq('user_id', testUser.id)
      .limit(1)
      .maybeSingle()
    
    if (midEmpError || !empForMiddleware) {
      console.error('❌ Middleware employee fetch would fail:', midEmpError)
      return
    }
    
    const middlewareRole = empForMiddleware.role || 
                          testUser.raw_user_meta_data?.role || 
                          testUser.user_metadata?.role
    
    if (!middlewareRole) {
      console.error('❌ Middleware role resolution would fail')
      return
    }
    
    if (!empForMiddleware.is_active) {
      console.error('❌ Middleware would reject inactive user')
      return
    }
    
    console.log('✅ Middleware simulation successful')
    console.log('   - Would allow role:', middlewareRole)
    console.log('   - Employee active:', empForMiddleware.is_active)

    console.log('\n🎉 All tests passed! Login should work now.')
    console.log('\n📋 Summary:')
    console.log('   - User exists in auth.users ✅')
    console.log('   - Employee record exists ✅')
    console.log('   - Role can be resolved ✅')
    console.log('   - Employee is active ✅')
    console.log('   - Auth service would succeed ✅')
    console.log('   - Middleware would allow access ✅')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testLoginFix().catch(console.error)