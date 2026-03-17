import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnoseLoginStuck() {
  console.log('=== Diagnosing Login Stuck Issue ===\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Test 1: Check if we can login
  console.log('Test 1: Attempting login...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mukhsin9@gmail.com',
    password: 'admin123'
  })
  
  if (authError) {
    console.error('❌ Login failed:', authError.message)
    return
  }
  
  console.log('✅ Login successful')
  console.log('User ID:', authData.user.id)
  console.log('Session exists:', !!authData.session)
  
  // Test 2: Check employee data
  console.log('\nTest 2: Checking employee data...')
  const { data: employee, error: empError } = await supabase
    .from('m_employees')
    .select('id, full_name, role, is_active, unit_id')
    .eq('user_id', authData.user.id)
    .single()
  
  if (empError) {
    console.error('❌ Employee fetch failed:', empError.message)
  } else {
    console.log('✅ Employee found:', employee.full_name)
    console.log('Role:', employee.role)
    console.log('Active:', employee.is_active)
    console.log('Unit ID:', employee.unit_id)
  }
  
  // Test 3: Check session persistence
  console.log('\nTest 3: Checking session persistence...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    console.log('✅ Session persisted after 1 second')
  } else {
    console.error('❌ Session lost after 1 second')
  }
  
  // Test 4: Check metadata
  console.log('\nTest 4: Checking user metadata...')
  const role = authData.user.user_metadata?.role
  console.log('Role in metadata:', role)
  
  if (!role) {
    console.error('❌ Role not found in user_metadata')
    console.log('Available metadata:', authData.user.user_metadata)
  } else {
    console.log('✅ Role found in metadata')
  }
  
  // Cleanup
  await supabase.auth.signOut()
  console.log('\n=== Diagnosis Complete ===')
}

diagnoseLoginStuck().catch(console.error)
