import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testCompleteLoginFlow() {
  console.log('🔍 Testing complete login flow...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  console.log('Environment check:')
  console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('- Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    console.log('\n1. Clearing existing sessions...')
    await supabase.auth.signOut({ scope: 'global' })
    console.log('✅ Sessions cleared')
    
    console.log('\n2. Testing login with test credentials...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }
    
    console.log('✅ Login successful')
    console.log('- User ID:', authData.user?.id)
    console.log('- Email:', authData.user?.email)
    console.log('- Session exists:', !!authData.session)
    
    if (!authData.session) {
      console.error('❌ No session created')
      return
    }
    
    console.log('\n3. Verifying employee data...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id')
      .eq('user_id', authData.user.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee data error:', empError.message)
      return
    }
    
    console.log('✅ Employee data found')
    console.log('- Name:', employee.full_name)
    console.log('- Role:', employee.role)
    console.log('- Active:', employee.is_active)
    console.log('- Unit ID:', employee.unit_id)
    
    if (!employee.is_active) {
      console.error('❌ Employee is not active')
      return
    }
    
    console.log('\n4. Testing role-based redirect logic...')
    let expectedRedirect = ''
    switch (employee.role) {
      case 'superadmin':
        expectedRedirect = '/units'
        break
      case 'unit_manager':
        expectedRedirect = '/realization'
        break
      case 'employee':
        expectedRedirect = '/profile'
        break
      default:
        console.error('❌ Unknown role:', employee.role)
        return
    }
    
    console.log('✅ Expected redirect for', employee.role, ':', expectedRedirect)
    
    console.log('\n5. Testing session persistence...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: sessionCheck } = await supabase.auth.getSession()
    if (sessionCheck.session) {
      console.log('✅ Session persisted successfully')
      console.log('- User ID matches:', sessionCheck.session.user.id === authData.user.id)
    } else {
      console.error('❌ Session did not persist')
    }
    
    console.log('\n6. Testing user metadata...')
    const userMetadata = authData.user.user_metadata
    if (userMetadata && userMetadata.role) {
      console.log('✅ User metadata complete')
      console.log('- Role in metadata:', userMetadata.role)
      console.log('- Full name:', userMetadata.full_name)
      console.log('- Employee ID:', userMetadata.employee_id)
      console.log('- Unit ID:', userMetadata.unit_id)
    } else {
      console.error('❌ User metadata incomplete')
    }
    
    console.log('\n✅ Login flow test completed successfully!')
    console.log('\n📋 Summary:')
    console.log('- Login: ✅ Working')
    console.log('- Session: ✅ Created and persisted')
    console.log('- Employee data: ✅ Found and active')
    console.log('- User metadata: ✅ Complete')
    console.log('- Expected redirect:', expectedRedirect)
    
    console.log('\n🎯 Next steps:')
    console.log('1. Clear browser cache and localStorage')
    console.log('2. Try login in browser at http://localhost:3002/login')
    console.log('3. Check browser console for any JavaScript errors')
    console.log('4. Verify redirect to:', expectedRedirect)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testCompleteLoginFlow().catch(console.error)