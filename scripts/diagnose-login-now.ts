import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnoseLogin() {
  console.log('=== DIAGNOSE LOGIN ===\n')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'
  
  console.log('1. Testing login with credentials:')
  console.log('   Email:', email)
  console.log('   Password: admin123\n')
  
  try {
    // Test sign in
    console.log('2. Attempting sign in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.error('❌ Sign in FAILED:', authError.message)
      console.error('   Error code:', authError.status)
      console.error('   Full error:', JSON.stringify(authError, null, 2))
      
      // Check if user exists
      console.log('\n3. Checking if user exists in auth.users...')
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usersError) {
        console.error('❌ Failed to list users:', usersError.message)
      } else {
        const user = users.users.find(u => u.email === email)
        if (user) {
          console.log('✅ User exists in auth.users')
          console.log('   User ID:', user.id)
          console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No')
          console.log('   Last sign in:', user.last_sign_in_at || 'Never')
          console.log('   User metadata:', JSON.stringify(user.user_metadata, null, 2))
        } else {
          console.log('❌ User NOT found in auth.users')
        }
      }
      
      return
    }
    
    console.log('✅ Sign in SUCCESSFUL')
    console.log('   User ID:', authData.user?.id)
    console.log('   Email:', authData.user?.email)
    console.log('   Session:', authData.session ? 'Created' : 'Not created')
    
    // Check user metadata
    console.log('\n3. Checking user metadata...')
    const role = authData.user?.user_metadata?.role || authData.user?.raw_user_meta_data?.role
    console.log('   Role from metadata:', role || 'NOT FOUND')
    console.log('   Full user_metadata:', JSON.stringify(authData.user?.user_metadata, null, 2))
    console.log('   Full raw_user_meta_data:', JSON.stringify(authData.user?.raw_user_meta_data, null, 2))
    
    // Check employee record
    console.log('\n4. Checking employee record...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, employee_code, full_name, unit_id, is_active')
      .eq('user_id', authData.user!.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch FAILED:', employeeError.message)
      console.error('   Error code:', employeeError.code)
      console.error('   Full error:', JSON.stringify(employeeError, null, 2))
    } else if (!employee) {
      console.log('❌ Employee record NOT FOUND')
    } else {
      console.log('✅ Employee record found')
      console.log('   Employee ID:', employee.id)
      console.log('   Employee code:', employee.employee_code)
      console.log('   Full name:', employee.full_name)
      console.log('   Unit ID:', employee.unit_id)
      console.log('   Is active:', employee.is_active)
    }
    
    // Test sign out
    console.log('\n5. Testing sign out...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out FAILED:', signOutError.message)
    } else {
      console.log('✅ Sign out successful')
    }
    
    console.log('\n=== DIAGNOSIS COMPLETE ===')
    
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error)
  }
}

diagnoseLogin()
