/**
 * Test RLS fix using server client
 */

import { createClient } from '@supabase/supabase-js'

async function testRLSFix() {
  console.log('🧪 Testing RLS fix with server client...')
  
  const supabaseUrl = 'https://omlbijupllrglmebbqnn.supabase.co'
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbGJpanVwbGxyZ2xtZWJicW5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY5MjExMSwiZXhwIjoyMDg4MjY4MTExfQ.xi0dZznj9Nybfsyw-mEP1459l0GnQqZmwQmfievYq8U'
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test the RLS functions
    console.log('📋 Testing RLS functions...')
    
    // Test is_superadmin function
    const { data: superadminTest, error: superadminError } = await supabase.rpc('is_superadmin')
    
    if (superadminError) {
      console.error('❌ is_superadmin() error:', superadminError)
    } else {
      console.log('✅ is_superadmin() works:', superadminTest)
    }
    
    // Test get_current_employee function
    const { data: employeeTest, error: employeeError } = await supabase.rpc('get_current_employee')
    
    if (employeeError) {
      console.error('❌ get_current_employee() error:', employeeError)
    } else {
      console.log('✅ get_current_employee() works:', employeeTest)
    }
    
    // Check m_employees table structure
    console.log('📋 Checking m_employees table...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('id, user_id, full_name, role')
      .limit(5)
    
    if (empError) {
      console.error('❌ m_employees query error:', empError)
    } else {
      console.log('✅ m_employees data:', employees)
    }
    
    console.log('🎉 RLS fix test completed!')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testRLSFix()