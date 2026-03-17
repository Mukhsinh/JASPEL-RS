#!/usr/bin/env tsx

/**
 * Quick fix for login session establishment issue
 */

import { config } from 'dotenv'
import { createServerClient } from '@supabase/ssr'

// Load environment variables
config({ path: '.env.local' })

async function quickFixLoginSession() {
  console.log('🔧 Quick fix for login session...')
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => null,
          set: () => {},
          remove: () => {}
        }
      }
    )
    
    // 1. Check if test user exists
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    const testUser = users.find(u => u.email === 'mukhsin9@gmail.com')
    if (!testUser) {
      console.log('❌ Test user not found')
      return
    }
    
    console.log('✅ Test user found:', testUser.id)
    
    // 2. Ensure employee record exists
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle()
    
    if (employeeError) {
      console.error('❌ Error checking employee:', employeeError)
      return
    }
    
    if (!employee) {
      console.log('🔧 Creating employee record...')
      
      // Get or create a unit first
      let { data: units } = await supabase
        .from('m_units')
        .select('id')
        .limit(1)
      
      let unitId = units?.[0]?.id
      
      if (!unitId) {
        const { data: newUnit } = await supabase
          .from('m_units')
          .insert({
            unit_name: 'Unit Administrasi',
            unit_code: 'ADM',
            is_active: true
          })
          .select('id')
          .single()
        
        unitId = newUnit?.id
      }
      
      // Create employee record
      const { error: createError } = await supabase
        .from('m_employees')
        .insert({
          user_id: testUser.id,
          employee_code: 'EMP001',
          full_name: 'Administrator',
          unit_id: unitId,
          tax_status: 'TK/0',
          is_active: true
        })
      
      if (createError) {
        console.error('❌ Error creating employee:', createError)
        return
      }
      
      console.log('✅ Employee record created')
    } else {
      console.log('✅ Employee record exists')
      
      // Ensure employee is active
      if (!employee.is_active) {
        await supabase
          .from('m_employees')
          .update({ is_active: true })
          .eq('id', employee.id)
        
        console.log('✅ Employee activated')
      }
    }
    
    console.log('✅ Login session fix completed')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

// Run the fix
quickFixLoginSession().catch(console.error)