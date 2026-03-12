#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixLoginAuthIssue() {
  console.log('🔧 Fixing login authentication issue...')
  
  try {
    const email = 'mukhsin9@gmail.com'
    const newPassword = 'admin123'
    
    console.log('1. Checking existing user...')
    
    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }
    
    const existingUser = users.users.find(u => u.email === email)
    
    if (!existingUser) {
      console.error('❌ User not found:', email)
      return
    }
    
    console.log('✅ User found:', {
      id: existingUser.id,
      email: existingUser.email,
      confirmed: existingUser.email_confirmed_at ? 'Yes' : 'No',
      metadata: existingUser.user_metadata
    })
    
    console.log('2. Updating user password and confirming email...')
    
    // Update user password and confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          role: 'superadmin',
          unit_id: '2fdd1bfd-1a7b-483b-b0a3-122f81e078ee',
          full_name: 'Mukhsin',
          employee_id: 'f8b70281-2c1f-44c1-9dfe-b8936b2739ed',
          email_verified: true
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }
    
    console.log('✅ User updated successfully')
    
    console.log('3. Verifying employee data...')
    
    // Check employee data
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', existingUser.id)
      .single()
    
    if (empError) {
      console.error('❌ Error fetching employee:', empError)
      return
    }
    
    if (!employee) {
      console.error('❌ Employee not found for user')
      return
    }
    
    console.log('✅ Employee data:', {
      id: employee.id,
      name: employee.full_name,
      active: employee.is_active,
      unit_id: employee.unit_id
    })
    
    console.log('4. Testing login...')
    
    // Test login with client
    const clientSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    const { data: loginData, error: loginError } = await clientSupabase.auth.signInWithPassword({
      email: email,
      password: newPassword
    })
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError)
      return
    }
    
    console.log('✅ Login test successful!')
    console.log('User ID:', loginData.user?.id)
    console.log('Email:', loginData.user?.email)
    console.log('Role:', loginData.user?.user_metadata?.role)
    
    // Sign out test user
    await clientSupabase.auth.signOut()
    
    console.log('\n🎉 Login authentication issue fixed!')
    console.log('📋 Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
    console.log('\n✅ You can now login to the application')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixLoginAuthIssue()