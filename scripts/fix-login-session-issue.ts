#!/usr/bin/env tsx

/**
 * Fix login session establishment issue
 */

import { config } from 'dotenv'
import { createBrowserClient } from '@supabase/ssr'

// Load environment variables
config({ path: '.env.local' })

function createTestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  
  return createBrowserClient(url, key)
}

async function fixLoginSession() {
  console.log('🔧 Fixing login session establishment issue...')
  
  try {
    const supabase = createTestClient()
    
    // 1. Check if user exists in auth.users
    console.log('1. Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Cannot access auth users (need service role):', authError.message)
    } else {
      console.log('✅ Found', authUsers.users.length, 'auth users')
      const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
      if (testUser) {
        console.log('✅ Test user found in auth:', testUser.id)
        console.log('   - Role in metadata:', testUser.user_metadata?.role)
      } else {
        console.log('❌ Test user not found in auth')
      }
    }
    
    // 2. Check employees table
    console.log('2. Checking employees table...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .limit(5)
    
    if (empError) {
      console.error('❌ Employee table error:', empError)
    } else {
      console.log('✅ Found', employees.length, 'employees')
      employees.forEach(emp => {
        console.log(`   - ${emp.full_name} (user_id: ${emp.user_id})`)
      })
    }
    
    // 3. Try login with better error handling
    console.log('3. Testing improved login flow...')
    
    // Clear any existing session
    await supabase.auth.signOut({ scope: 'local' })
    
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })
    
    if (loginError || !authData.user) {
      console.error('❌ Login failed:', loginError)
      return
    }
    
    console.log('✅ Login successful')
    console.log('   - User ID:', authData.user.id)
    console.log('   - Session available:', !!authData.session)
    
    // 4. Check session persistence
    if (authData.session) {
      console.log('4. Session established immediately')
      
      // Try to fetch employee data
      const { data: employeeData, error: fetchError } = await supabase
        .from('m_employees')
        .select('id, full_name, unit_id, is_active')
        .eq('user_id', authData.user.id)
        .maybeSingle()
      
      if (fetchError) {
        console.error('❌ Employee fetch error:', fetchError)
      } else if (employeeData) {
        console.log('✅ Employee data found:', employeeData.full_name)
      } else {
        console.log('⚠️ No employee record found for user:', authData.user.id)
        
        // Check if we need to create employee record
        console.log('5. Checking if employee record needs to be created...')
        const { data: existingEmp } = await supabase
          .from('m_employees')
          .select('*')
          .eq('user_id', authData.user.id)
        
        if (!existingEmp || existingEmp.length === 0) {
          console.log('⚠️ Creating missing employee record...')
          
          const { data: newEmployee, error: createError } = await supabase
            .from('m_employees')
            .insert({
              user_id: authData.user.id,
              employee_code: 'ADMIN001',
              full_name: 'Administrator',
              unit_id: null,
              tax_status: 'TK/0',
              is_active: true
            })
            .select()
            .single()
          
          if (createError) {
            console.error('❌ Failed to create employee record:', createError)
          } else {
            console.log('✅ Employee record created successfully')
          }
        }
      }
    } else {
      console.log('❌ No session in auth response')
    }
    
    console.log('✅ Login session fix completed')
    
  } catch (error) {
    console.error('❌ Fix failed with error:', error)
  }
}

// Run the fix
fixLoginSession().catch(console.error)