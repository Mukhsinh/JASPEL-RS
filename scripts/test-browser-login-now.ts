import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Simulate browser storage
class MockStorage {
  private store: Map<string, string> = new Map()
  
  getItem(key: string): string | null {
    return this.store.get(key) || null
  }
  
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
  
  removeItem(key: string): void {
    this.store.delete(key)
  }
  
  clear(): void {
    this.store.clear()
  }
}

async function testBrowserLogin() {
  console.log('=== TEST BROWSER-LIKE LOGIN ===\n')
  
  const mockStorage = new MockStorage()
  
  // Create client with browser-like storage
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: mockStorage as any,
      storageKey: 'sb-auth-token'
    }
  })
  
  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'
  
  console.log('1. Testing login with browser-like storage...')
  console.log('   Email:', email)
  console.log('   Password: admin123\n')
  
  try {
    // Clear any existing session
    console.log('2. Clearing existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    console.log('   Storage cleared\n')
    
    // Test sign in
    console.log('3. Attempting sign in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })
    
    if (authError) {
      console.error('❌ Sign in FAILED:', authError.message)
      console.error('   Error code:', authError.status)
      console.error('   Error name:', authError.name)
      return
    }
    
    console.log('✅ Sign in SUCCESSFUL')
    console.log('   User ID:', authData.user?.id)
    console.log('   Email:', authData.user?.email)
    console.log('   Session:', authData.session ? 'Created' : 'Not created')
    
    // Check what's stored
    console.log('\n4. Checking stored session...')
    const storedSession = mockStorage.getItem('sb-auth-token')
    if (storedSession) {
      console.log('✅ Session stored in storage')
      const parsed = JSON.parse(storedSession)
      console.log('   Access token:', parsed.access_token ? 'Present' : 'Missing')
      console.log('   Refresh token:', parsed.refresh_token ? 'Present' : 'Missing')
      console.log('   Expires at:', parsed.expires_at ? new Date(parsed.expires_at * 1000).toISOString() : 'Missing')
    } else {
      console.log('❌ No session stored')
    }
    
    // Test getting session
    console.log('\n5. Testing getSession...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ getSession FAILED:', sessionError.message)
    } else if (!sessionData.session) {
      console.log('❌ No session returned')
    } else {
      console.log('✅ Session retrieved successfully')
      console.log('   User ID:', sessionData.session.user.id)
      console.log('   Email:', sessionData.session.user.email)
    }
    
    // Check user metadata
    console.log('\n6. Checking user metadata...')
    const role = authData.user?.user_metadata?.role
    console.log('   Role:', role || 'NOT FOUND')
    
    if (!role) {
      console.log('   ⚠️  WARNING: Role not found in user_metadata')
      console.log('   This will cause login to fail in the app')
    }
    
    // Check employee record
    console.log('\n7. Checking employee record...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user!.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch FAILED:', employeeError.message)
    } else if (!employee) {
      console.log('❌ Employee record NOT FOUND')
    } else {
      console.log('✅ Employee record found')
      console.log('   Name:', employee.full_name)
      console.log('   Active:', employee.is_active)
    }
    
    // Test sign out
    console.log('\n8. Testing sign out...')
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' })
    
    if (signOutError) {
      console.error('❌ Sign out FAILED:', signOutError.message)
    } else {
      console.log('✅ Sign out successful')
    }
    
    // Check storage after sign out
    console.log('\n9. Checking storage after sign out...')
    const storedAfterSignOut = mockStorage.getItem('sb-auth-token')
    if (storedAfterSignOut) {
      console.log('⚠️  Session still in storage (should be cleared)')
    } else {
      console.log('✅ Storage cleared')
    }
    
    console.log('\n=== TEST COMPLETE ===')
    
  } catch (error: any) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message)
    console.error('   Stack:', error.stack)
  }
}

testBrowserLogin()
