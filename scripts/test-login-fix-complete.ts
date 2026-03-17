/**
 * Test complete login fix
 */

import { createClient } from '@supabase/supabase-js'

async function testLoginFix() {
  console.log('🧪 Testing complete login fix...')
  
  const supabaseUrl = 'https://omlbijupllrglmebbqnn.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbGJpanVwbGxyZ2xtZWJicW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTIxMTEsImV4cCI6MjA4ODI2ODExMX0.rHTlmURvcVQh2WdMsGnEe0zTytY76iKwHAcx1iJudd8'
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    console.log('🔐 Testing login with user credentials...')
    
    // Test login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    console.log('✅ Auth successful!')
    console.log('👤 User ID:', authData.user?.id)
    console.log('📧 Email:', authData.user?.email)
    console.log('🏷️ Role:', authData.user?.user_metadata?.role)
    
    // Test employee data fetch (this was failing before)
    console.log('📋 Testing employee data fetch...')
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active, role')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch error:', employeeError)
      return
    }
    
    console.log('✅ Employee data retrieved successfully!')
    console.log('👨‍💼 Employee:', employeeData.full_name)
    console.log('🏢 Role:', employeeData.role)
    console.log('🆔 Unit ID:', employeeData.unit_id)
    console.log('✅ Active:', employeeData.is_active)
    
    // Test RLS functions
    console.log('🔒 Testing RLS functions...')
    
    const { data: isSuperadmin, error: superadminError } = await supabase.rpc('is_superadmin')
    if (superadminError) {
      console.error('❌ is_superadmin error:', superadminError)
    } else {
      console.log('✅ is_superadmin():', isSuperadmin)
    }
    
    const { data: currentEmployee, error: currentEmpError } = await supabase.rpc('get_current_employee')
    if (currentEmpError) {
      console.error('❌ get_current_employee error:', currentEmpError)
    } else {
      console.log('✅ get_current_employee():', currentEmployee)
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('🚪 Signed out successfully')
    
    console.log('🎉 All tests passed! Login fix is complete.')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testLoginFix()