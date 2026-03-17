import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseLoginError() {
  console.log('🔍 Diagnosing login error...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Check if user exists in auth.users
    console.log('\n1. Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }
    
    console.log(`✅ Found ${authUsers.users.length} users in auth.users`)
    
    const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
    if (testUser) {
      console.log('✅ Test user found in auth.users:', {
        id: testUser.id,
        email: testUser.email,
        email_confirmed_at: testUser.email_confirmed_at,
        user_metadata: testUser.user_metadata
      })
    } else {
      console.log('❌ Test user NOT found in auth.users')
    }
    
    // 2. Check m_employees table
    console.log('\n2. Checking m_employees table...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .limit(10)
    
    if (empError) {
      console.error('❌ Error fetching employees:', empError)
    } else {
      console.log(`✅ Found ${employees.length} employees`)
      
      if (testUser) {
        const testEmployee = employees.find(e => e.user_id === testUser.id)
        if (testEmployee) {
          console.log('✅ Test employee found:', {
            id: testEmployee.id,
            full_name: testEmployee.full_name,
            is_active: testEmployee.is_active,
            role: testEmployee.role,
            user_id: testEmployee.user_id
          })
        } else {
          console.log('❌ Test employee NOT found in m_employees')
        }
      }
    }
    
    // 3. Test login attempt
    console.log('\n3. Testing login attempt...')
    
    // Create browser client for testing
    const browserClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    const { data: loginData, error: loginError } = await browserClient.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError)
    } else {
      console.log('✅ Login successful:', {
        user_id: loginData.user?.id,
        email: loginData.user?.email,
        session_exists: !!loginData.session
      })
      
      // Test session immediately
      const { data: sessionData } = await browserClient.auth.getSession()
      console.log('Session check:', {
        session_exists: !!sessionData.session,
        user_id: sessionData.session?.user?.id
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

diagnoseLoginError().catch(console.error)