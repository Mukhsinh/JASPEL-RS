#!/usr/bin/env tsx

/**
 * Fix Login Session Storage Issue
 * Memperbaiki masalah penyimpanan session setelah login
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createBrowserClient } from '@supabase/ssr'

function createFixedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable URL detection for server environment
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          // Mock storage for server environment
          return null
        },
        setItem: (key: string, value: string) => {
          console.log(`📝 Would store: ${key} = ${value.substring(0, 50)}...`)
        },
        removeItem: (key: string) => {
          console.log(`🗑️  Would remove: ${key}`)
        }
      }
    }
  })
}

async function fixLoginSessionStorage() {
  console.log('🔧 Memperbaiki masalah session storage...\n')

  try {
    // 1. Test with fixed client
    console.log('Step 1: Testing with fixed client configuration...')
    const supabase = createFixedClient()
    console.log('✅ Fixed client created')

    // 2. Clear any existing session
    console.log('\nStep 2: Clearing existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    console.log('✅ Session cleared')

    // 3. Test login with proper session handling
    console.log('\nStep 3: Testing login with session persistence...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', authData.user?.id)
    console.log('   Session available:', !!authData.session)

    if (authData.session) {
      console.log('   Access token present:', !!authData.session.access_token)
      console.log('   Refresh token present:', !!authData.session.refresh_token)
      console.log('   Expires at:', new Date(authData.session.expires_at! * 1000).toLocaleString())
    }

    // 4. Wait and check session persistence
    console.log('\nStep 4: Checking session persistence after delay...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session: persistedSession } } = await supabase.auth.getSession()
    
    if (persistedSession) {
      console.log('✅ Session persisted successfully')
      console.log('   Session ID matches:', persistedSession.access_token === authData.session?.access_token)
    } else {
      console.log('❌ Session not persisted')
    }

    // 5. Test employee data with session
    if (persistedSession) {
      console.log('\nStep 5: Testing employee data fetch with persisted session...')
      const { data: employee, error: employeeError } = await supabase
        .from('m_employees')
        .select('id, full_name, is_active, role')
        .eq('user_id', authData.user.id)
        .single()

      if (employeeError) {
        console.error('❌ Employee fetch failed:', employeeError.message)
      } else {
        console.log('✅ Employee data fetched successfully')
        console.log('   Name:', employee.full_name)
        console.log('   Role:', employee.role)
      }
    }

    // 6. Clean up
    console.log('\nStep 6: Cleaning up...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

    console.log('\n🎉 Session storage test completed!')

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

// Run fix
fixLoginSessionStorage()