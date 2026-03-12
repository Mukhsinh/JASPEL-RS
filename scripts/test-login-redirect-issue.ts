import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testLoginRedirectIssue() {
  console.log('=== TEST LOGIN REDIRECT ISSUE ===\n')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => null,
        setItem: (key, value) => {},
        removeItem: (key) => {}
      }
    }
  })
  
  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'
  
  console.log('Testing login flow that matches browser behavior...\n')
  
  try {
    // Step 1: Clear session
    console.log('1. Clearing any existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    console.log('   ✅ Session cleared\n')
    
    // Step 2: Sign in
    console.log('2. Signing in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })
    
    if (authError) {
      console.error('   ❌ FAILED:', authError.message)
      console.error('   Error details:', JSON.stringify(authError, null, 2))
      return
    }
    
    console.log('   ✅ Sign in successful')
    console.log('   User ID:', authData.user?.id)
    console.log('   Session created:', !!authData.session)
    
    // Step 3: Check metadata
    console.log('\n3. Checking user metadata (required for app)...')
    const role = authData.user?.user_metadata?.role || authData.user?.raw_user_meta_data?.role
    
    if (!role) {
      console.error('   ❌ CRITICAL: Role not found in metadata!')
      console.error('   This will cause login to fail in the app')
      console.error('   user_metadata:', JSON.stringify(authData.user?.user_metadata, null, 2))
      console.error('   raw_user_meta_data:', JSON.stringify(authData.user?.raw_user_meta_data, null, 2))
      return
    }
    
    console.log('   ✅ Role found:', role)
    
    // Step 4: Check employee
    console.log('\n4. Fetching employee data (required for app)...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user!.id)
      .limit(1)
      .single()
    
    if (employeeError) {
      console.error('   ❌ FAILED:', employeeError.message)
      console.error('   Error code:', employeeError.code)
      return
    }
    
    if (!employee) {
      console.error('   ❌ Employee not found')
      return
    }
    
    console.log('   ✅ Employee found:', employee.full_name)
    console.log('   Active:', employee.is_active)
    
    if (!employee.is_active) {
      console.error('   ❌ Employee is inactive')
      return
    }
    
    // Step 5: Simulate what happens after login
    console.log('\n5. Simulating post-login flow...')
    console.log('   User should be redirected to: /dashboard')
    console.log('   Middleware should allow access based on role:', role)
    
    // Step 6: Test session retrieval (what middleware does)
    console.log('\n6. Testing session retrieval (middleware check)...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('   ❌ getSession failed:', sessionError.message)
      return
    }
    
    if (!sessionData.session) {
      console.error('   ❌ No session found')
      return
    }
    
    console.log('   ✅ Session valid')
    console.log('   Session expires:', new Date(sessionData.session.expires_at! * 1000).toISOString())
    
    // Step 7: Check if session has required data
    console.log('\n7. Validating session data...')
    const sessionRole = sessionData.session.user.user_metadata?.role
    
    if (!sessionRole) {
      console.error('   ❌ Role missing from session')
      return
    }
    
    console.log('   ✅ Session has role:', sessionRole)
    
    console.log('\n=== DIAGNOSIS ===')
    console.log('✅ Login flow is working correctly')
    console.log('✅ All required data is present')
    console.log('✅ User should be able to access /dashboard')
    console.log('\nIf login still fails in browser, the issue is likely:')
    console.log('1. Browser storage/cookies being blocked')
    console.log('2. CORS or security policy issues')
    console.log('3. Client-side JavaScript errors')
    console.log('4. Redirect happening before session is saved')
    
  } catch (error: any) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message)
    console.error('Stack:', error.stack)
  }
}

testLoginRedirectIssue()
