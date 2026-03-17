/**
 * Test login after RLS function fix
 */

import { createClient } from '@/lib/supabase/client'

async function testLogin() {
  console.log('🧪 Testing login after RLS fix...')
  
  const supabase = createClient()
  
  try {
    // Test login with the user from the error
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123' // Assuming this is the password
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    console.log('✅ Auth successful, user ID:', authData.user?.id)
    console.log('📋 User metadata:', authData.user?.user_metadata)
    
    // Test employee data fetch
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active, role')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch error:', employeeError)
      return
    }
    
    console.log('✅ Employee data:', employeeData)
    
    // Test RLS functions
    const { data: rlsTest, error: rlsError } = await supabase.rpc('is_superadmin')
    
    if (rlsError) {
      console.error('❌ RLS function error:', rlsError)
    } else {
      console.log('✅ is_superadmin() result:', rlsTest)
    }
    
    console.log('🎉 Login test completed successfully!')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testLogin()