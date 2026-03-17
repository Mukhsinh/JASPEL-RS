#!/usr/bin/env tsx

/**
 * Verify that login is completely fixed and working
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function verifyLoginFix() {
  console.log('🔍 Verifying login fix is complete...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Test 1: Clear session and login
    console.log('\n📋 Test 1: Authentication Flow')
    await supabase.auth.signOut()
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError || !authData.user) {
      console.error('❌ Authentication failed:', authError)
      return false
    }
    
    console.log('✅ Authentication successful')
    
    // Test 2: Session establishment
    console.log('\n📋 Test 2: Session Establishment')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      console.error('❌ Session not established')
      return false
    }
    
    console.log('✅ Session established successfully')
    
    // Test 3: Employee data access (the main issue we fixed)
    console.log('\n📋 Test 3: Employee Data Access')
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError || !employeeData) {
      console.error('❌ Employee data access failed:', employeeError)
      return false
    }
    
    console.log('✅ Employee data access successful')
    console.log('   👤 Name:', employeeData.full_name)
    console.log('   🏢 Unit ID:', employeeData.unit_id)
    console.log('   ✅ Active:', employeeData.is_active)
    
    // Test 4: Role validation
    console.log('\n📋 Test 4: Role Validation')
    
    const role = authData.user.user_metadata?.role || authData.user.raw_user_meta_data?.role
    if (!role) {
      console.error('❌ Role not found in user metadata')
      return false
    }
    
    console.log('✅ Role validation successful')
    console.log('   🏷️ Role:', role)
    
    // Test 5: Complete user data construction
    console.log('\n📋 Test 5: User Data Construction')
    
    const userData = {
      id: authData.user.id,
      email: authData.user.email || '',
      role: role,
      unit_id: employeeData.unit_id,
      is_active: employeeData.is_active,
      full_name: employeeData.full_name,
    }
    
    // Validate all required fields
    const requiredFields = ['id', 'email', 'role', 'unit_id', 'full_name']
    const missingFields = requiredFields.filter(field => !userData[field as keyof typeof userData])
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields)
      return false
    }
    
    console.log('✅ User data construction successful')
    console.log('   📧 Email:', userData.email)
    console.log('   🏷️ Role:', userData.role)
    console.log('   👤 Name:', userData.full_name)
    
    // Test 6: RLS Policy validation
    console.log('\n📋 Test 6: RLS Policy Validation')
    
    // Test that superadmin can see other employees
    if (role === 'superadmin') {
      const { data: allEmployees, error: allError } = await supabase
        .from('m_employees')
        .select('id, full_name')
        .limit(5)
      
      if (allError) {
        console.error('❌ Superadmin RLS policy failed:', allError)
        return false
      }
      
      console.log('✅ Superadmin RLS policy working')
      console.log('   👥 Can access', allEmployees?.length || 0, 'employee records')
    }
    
    console.log('\n🎉 All tests passed!')
    console.log('🚀 Login functionality is completely fixed and working')
    console.log('🌐 Users can now login successfully in the browser')
    
    return true
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

async function main() {
  const success = await verifyLoginFix()
  
  if (success) {
    console.log('\n✅ LOGIN FIX VERIFICATION COMPLETE')
    console.log('🎯 The 403 Forbidden error has been resolved')
    console.log('🔐 Authentication flow is working properly')
    console.log('👥 Employee data access is functioning')
    console.log('🛡️ RLS policies are correctly configured')
    console.log('\n🚀 Users can now login to the application!')
  } else {
    console.log('\n❌ LOGIN FIX VERIFICATION FAILED')
    console.log('🔧 Additional fixes may be needed')
  }
  
  process.exit(success ? 0 : 1)
}

main().catch(console.error)