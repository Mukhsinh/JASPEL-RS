#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function diagnoseLoginRedirectIssue() {
  console.log('🔍 Mendiagnosa masalah login redirect...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test login dengan kredensial yang sama
    console.log('1. Testing login dengan mukhsin9@gmail.com...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.log('❌ Login error:', loginError.message)
      return
    }
    
    console.log('✅ Login berhasil')
    console.log('User ID:', loginData.user?.id)
    console.log('Email:', loginData.user?.email)
    console.log('Role dari metadata:', loginData.user?.user_metadata?.role)
    
    // Check session
    console.log('\n2. Checking session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
    } else if (sessionData.session) {
      console.log('✅ Session valid')
      console.log('Session user ID:', sessionData.session.user.id)
      console.log('Session expires at:', new Date(sessionData.session.expires_at! * 1000))
    } else {
      console.log('❌ No session found')
    }
    
    // Check employee record
    console.log('\n3. Checking employee record...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, user_id, role, is_active, name')
      .eq('user_id', loginData.user?.id)
      .maybeSingle()
    
    if (employeeError) {
      console.log('❌ Employee query error:', employeeError.message)
    } else if (employee) {
      console.log('✅ Employee record found:')
      console.log('  ID:', employee.id)
      console.log('  Name:', employee.name)
      console.log('  Role:', employee.role)
      console.log('  Active:', employee.is_active)
    } else {
      console.log('❌ No employee record found')
    }
    
    // Test middleware path access
    console.log('\n4. Testing dashboard access...')
    try {
      const response = await fetch('http://localhost:3002/dashboard', {
        headers: {
          'Cookie': `sb-access-token=${sessionData.session?.access_token}; sb-refresh-token=${sessionData.session?.refresh_token}`
        }
      })
      
      console.log('Dashboard response status:', response.status)
      
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location')
        console.log('Redirected to:', location)
      }
    } catch (error) {
      console.log('Error testing dashboard access:', error)
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error)
  }
}

diagnoseLoginRedirectIssue()