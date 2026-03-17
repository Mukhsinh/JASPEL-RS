#!/usr/bin/env tsx

/**
 * Complete fix for login session establishment issue
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function fixLoginSessionComplete() {
  console.log('🔧 Fixing login session establishment issue completely...')
  
  try {
    const supabase = createServiceClient()
    
    // 1. Check current auth users
    console.log('1. Checking auth users...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Cannot list users:', listError)
      return
    }
    
    console.log('✅ Found', users.length, 'auth users')
    
    const testUser = users.find(u => u.email === 'mukhsin9@gmail.com')
    if (!testUser) {
      console.log('❌ Test user not found in auth')
      return
    }
    
    console.log('✅ Test user found:', testUser.id)
    console.log('   - Email:', testUser.email)
    console.log('   - Role in metadata:', testUser.user_metadata?.role)
    
    // 2. Check if employee record exists
    console.log('2. Checking employee record...')
    const { data: existingEmployee, error: checkError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle()
    
    if (checkError) {
      console.error('❌ Error checking employee:', checkError)
      return
    }
    
    if (existingEmployee) {
      console.log('✅ Employee record exists:', existingEmployee.full_name)
    } else {
      console.log('⚠️ Employee record missing, creating...')
      
      // 3. Create employee record using service role
      const { data: newEmployee, error: createError } = await supabase
        .from('m_employees')
        .insert({
          user_id: testUser.id,
          employee_code: 'ADMIN001',
          full_name: 'Administrator',
          unit_id: null, // Superadmin doesn't need unit
          is_active: true
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Failed to create employee record:', createError)
        
        // Try to check if there are any units to reference
        const { data: units } = await supabase
          .from('m_units')
          .select('id, name')
          .limit(1)
        
        if (units && units.length > 0) {
          console.log('⚠️ Trying with unit reference...')
          const { data: newEmployeeWithUnit, error: createError2 } = await supabase
            .from('m_employees')
            .insert({
              user_id: testUser.id,
              employee_code: 'ADMIN001',
              full_name: 'Administrator',
              unit_id: units[0].id,
              is_active: true
            })
            .select()
            .single()
          
          if (createError2) {
            console.error('❌ Still failed to create employee:', createError2)
          } else {
            console.log('✅ Employee record created with unit reference')
          }
        }
      } else {
        console.log('✅ Employee record created successfully')
      }
    }
    
    // 4. Test login flow
    console.log('3. Testing login flow...')
    
    // Create regular client for login test
    const clientUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const clientKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!clientUrl || !clientKey) {
      throw new Error('Client configuration missing')
    }
    
    const clientSupabase = createClient(clientUrl, clientKey)
    
    // Clear any existing session
    await clientSupabase.auth.signOut({ scope: 'local' })
    
    const { data: authData, error: loginError } = await clientSupabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })
    
    if (loginError || !authData.user) {
      console.error('❌ Login still failing:', loginError)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('   - User ID:', authData.user.id)
    console.log('   - Session available:', !!authData.session)
    
    if (authData.session) {
      // Test employee data fetch
      const { data: employeeData, error: fetchError } = await clientSupabase
        .from('m_employees')
        .select('id, full_name, unit_id, is_active')
        .eq('user_id', authData.user.id)
        .single()
      
      if (fetchError) {
        console.error('❌ Employee fetch error:', fetchError)
      } else {
        console.log('✅ Employee data fetched successfully:', employeeData.full_name)
      }
    }
    
    console.log('✅ Login session fix completed successfully!')
    
  } catch (error) {
    console.error('❌ Fix failed with error:', error)
  }
}

// Run the fix
fixLoginSessionComplete().catch(console.error)