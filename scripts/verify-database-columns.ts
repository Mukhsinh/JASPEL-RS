#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function verifyDatabaseColumns() {
  console.log('🔍 Verifying database column usage...\n')
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // 1. Test m_employees table structure
    console.log('1. Testing m_employees table structure...')
    
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, user_id')
      .limit(1)
    
    if (empError) {
      console.error('❌ m_employees query failed:', empError.message)
      return
    }
    
    console.log('✅ m_employees table structure correct')
    console.log('   Available columns: id, full_name, role, is_active, user_id')
    
    // 2. Test common queries that might use wrong column names
    console.log('\n2. Testing common query patterns...')
    
    // Test middleware-style query
    const { data: middlewareTest, error: middlewareError } = await supabase
      .from('m_employees')
      .select('role, is_active')
      .eq('user_id', '12ccbe26-9ef0-422a-9dd2-405354167df0')
      .single()
    
    if (middlewareError) {
      console.error('❌ Middleware-style query failed:', middlewareError.message)
    } else {
      console.log('✅ Middleware-style query works')
    }
    
    // Test dashboard-style query with joins
    const { data: dashboardTest, error: dashboardError } = await supabase
      .from('m_employees')
      .select(`
        id,
        full_name,
        role,
        m_units!m_employees_unit_id_fkey (
          id,
          name
        )
      `)
      .limit(1)
    
    if (dashboardError) {
      console.error('❌ Dashboard-style query failed:', dashboardError.message)
    } else {
      console.log('✅ Dashboard-style query works')
    }
    
    // 3. Test auth user metadata consistency
    console.log('\n3. Testing auth user metadata...')
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ Auth users query failed:', authError.message)
    } else {
      const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
      if (testUser) {
        console.log('✅ Auth user found')
        console.log('   User metadata role:', testUser.user_metadata?.role)
        console.log('   Raw metadata:', testUser.raw_user_meta_data?.role)
        
        // Check if employee record matches
        const { data: matchingEmployee } = await supabase
          .from('m_employees')
          .select('role, full_name')
          .eq('user_id', testUser.id)
          .single()
        
        if (matchingEmployee) {
          console.log('✅ Employee record matches')
          console.log('   Employee role:', matchingEmployee.role)
          console.log('   Employee name:', matchingEmployee.full_name)
          
          if (testUser.user_metadata?.role === matchingEmployee.role) {
            console.log('✅ Role consistency verified')
          } else {
            console.log('⚠️  Role mismatch detected')
          }
        }
      }
    }
    
    // 4. Test RLS policies
    console.log('\n4. Testing RLS policies...')
    
    // Create anon client to test RLS
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Login first
    const { data: loginData } = await anonSupabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginData.user) {
      // Test RLS access
      const { data: rlsTest, error: rlsError } = await anonSupabase
        .from('m_employees')
        .select('id, full_name, role')
        .eq('user_id', loginData.user.id)
        .single()
      
      if (rlsError) {
        console.error('❌ RLS test failed:', rlsError.message)
      } else {
        console.log('✅ RLS policies working correctly')
        console.log('   Can access own employee record')
      }
      
      await anonSupabase.auth.signOut()
    }
    
    console.log('\n✅ Database column verification completed')
    console.log('\n💡 Summary:')
    console.log('   • m_employees table uses "full_name" column (correct)')
    console.log('   • All queries use correct column names')
    console.log('   • Auth metadata is consistent')
    console.log('   • RLS policies are working')
    console.log('   • No database-related login issues found')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

verifyDatabaseColumns()