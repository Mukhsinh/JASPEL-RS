#!/usr/bin/env tsx

/**
 * Diagnose Browser Login Issue
 * Menganalisis dan memperbaiki masalah login di browser
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createBrowserClient } from '@supabase/ssr'

function createTestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not found')
  }
  
  return createBrowserClient(url, key)
}

async function diagnoseBrowserLoginIssue() {
  console.log('🔍 Mendiagnosis masalah login browser...\n')

  try {
    // 1. Test Supabase client creation
    console.log('Step 1: Testing Supabase client creation...')
    const supabase = createTestClient()
    console.log('✅ Supabase client created successfully')

    // 2. Clear any existing session
    console.log('\nStep 2: Clearing existing session...')
    await supabase.auth.signOut({ scope: 'local' })
    console.log('✅ Session cleared')

    // 3. Test login with credentials
    console.log('\nStep 3: Testing login...')
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
    console.log('   Email:', authData.user?.email)

    // 4. Check session immediately
    console.log('\nStep 4: Checking session...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('❌ No session found after login')
      return
    }

    console.log('✅ Session found')
    console.log('   Access token length:', session.access_token.length)
    console.log('   Expires at:', new Date(session.expires_at! * 1000).toLocaleString())

    // 5. Test employee data fetch
    console.log('\nStep 5: Testing employee data fetch...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, is_active, role')
      .eq('user_id', authData.user.id)
      .single()

    if (employeeError) {
      console.error('❌ Employee fetch failed:', employeeError.message)
      return
    }

    console.log('✅ Employee data found')
    console.log('   Name:', employee.full_name)
    console.log('   Role:', employee.role)
    console.log('   Active:', employee.is_active)

    // 6. Test localStorage
    console.log('\nStep 6: Testing localStorage...')
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.includes('supabase'))
      console.log('✅ LocalStorage keys found:', keys.length)
      keys.forEach(key => {
        const value = localStorage.getItem(key)
        console.log(`   ${key}: ${value ? 'present' : 'missing'}`)
      })
    } else {
      console.log('⚠️  Running in server environment, localStorage not available')
    }

    // 7. Clean up
    console.log('\nStep 7: Cleaning up...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

    console.log('\n🎉 Diagnosis completed successfully!')
    console.log('\n📋 Recommendations:')
    console.log('   1. Check browser console for JavaScript errors')
    console.log('   2. Clear browser cache and cookies')
    console.log('   3. Disable browser extensions temporarily')
    console.log('   4. Try incognito/private browsing mode')

  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  }
}

// Run diagnosis
diagnoseBrowserLoginIssue()