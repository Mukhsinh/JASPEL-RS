#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function diagnoseConsoleErrors() {
  console.log('🔍 Diagnosing potential console errors...\n')
  
  try {
    // 1. Test Supabase client creation (browser-like)
    console.log('1. Testing Supabase client creation...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Environment variables missing:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
      console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
      return
    }
    
    console.log('✅ Environment variables present')
    console.log('   Supabase URL:', supabaseUrl)
    console.log('   Anon Key length:', supabaseKey.length, 'characters')
    
    // 2. Test client creation
    console.log('\n2. Creating Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // 3. Test initial connection
    console.log('\n3. Testing initial connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('m_employees')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Initial connection failed:', connectionError.message)
      console.error('   Error code:', connectionError.code)
      console.error('   Error details:', connectionError.details)
      return
    }
    
    console.log('✅ Initial connection successful')
    
    // 4. Test auth state
    console.log('\n4. Testing auth state...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message)
    } else {
      console.log('✅ Session check successful')
      console.log('   Current session:', session ? 'Active' : 'None')
    }
    
    // 5. Test login process
    console.log('\n5. Testing login process...')
    
    // Clear any existing session first
    await supabase.auth.signOut({ scope: 'global' })
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      console.error('   Error type:', typeof loginError)
      console.error('   Error properties:', Object.keys(loginError))
      
      // Check for common error patterns
      if (loginError.message.includes('Invalid login credentials')) {
        console.error('   → Credentials are incorrect or user doesn\'t exist')
      } else if (loginError.message.includes('Email not confirmed')) {
        console.error('   → Email needs to be confirmed')
      } else if (loginError.message.includes('Too many requests')) {
        console.error('   → Rate limited, wait before trying again')
      } else if (loginError.message.includes('Network')) {
        console.error('   → Network connectivity issue')
      }
      
      return
    }
    
    console.log('✅ Login successful')
    console.log('   User ID:', loginData.user?.id)
    console.log('   Email:', loginData.user?.email)
    console.log('   Session expires:', new Date(loginData.session?.expires_at! * 1000).toLocaleString())
    
    // 6. Test employee data access
    console.log('\n6. Testing employee data access...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active')
      .eq('user_id', loginData.user?.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee data access failed:', empError.message)
      console.error('   Error hint:', empError.hint)
      console.error('   Error code:', empError.code)
      
      // Check for RLS issues
      if (empError.message.includes('RLS')) {
        console.error('   → Row Level Security policy blocking access')
      } else if (empError.message.includes('permission denied')) {
        console.error('   → Permission denied - check RLS policies')
      }
      
      return
    }
    
    console.log('✅ Employee data accessible')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)
    
    // 7. Test auth state listener
    console.log('\n7. Testing auth state listener...')
    let listenerCalled = false
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`   Auth event: ${event}`)
      if (session) {
        console.log(`   Session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
      }
      listenerCalled = true
    })
    
    // Wait for listener
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (listenerCalled) {
      console.log('✅ Auth state listener working')
    } else {
      console.log('⚠️  Auth state listener not triggered')
    }
    
    subscription.unsubscribe()
    
    // 8. Test session persistence
    console.log('\n8. Testing session persistence...')
    const { data: { session: persistedSession } } = await supabase.auth.getSession()
    
    if (persistedSession) {
      console.log('✅ Session persisted correctly')
      console.log('   Session ID matches:', persistedSession.user.id === loginData.user?.id)
    } else {
      console.error('❌ Session not persisted')
    }
    
    // Clean up
    await supabase.auth.signOut()
    
    console.log('\n✅ Console error diagnosis completed')
    console.log('\n💡 Common console errors and solutions:')
    console.log('   • "Failed to fetch" → Network/CORS issue, check internet connection')
    console.log('   • "Invalid login credentials" → Wrong email/password or user not found')
    console.log('   • "RLS policy" → Database permission issue, check user_id mapping')
    console.log('   • "Storage not available" → Browser blocking localStorage/cookies')
    console.log('   • "Network error" → Firewall/antivirus blocking Supabase connection')
    
  } catch (error: any) {
    console.error('❌ Unexpected error during diagnosis:')
    console.error('   Message:', error.message)
    console.error('   Type:', typeof error)
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'))
    
    // Check for specific error types
    if (error.name === 'TypeError') {
      console.error('   → Likely a JavaScript/TypeScript type error')
    } else if (error.name === 'NetworkError') {
      console.error('   → Network connectivity issue')
    } else if (error.message.includes('fetch')) {
      console.error('   → HTTP request failed, check network/CORS')
    }
  }
}

diagnoseConsoleErrors()