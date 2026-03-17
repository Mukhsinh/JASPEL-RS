#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createBrowserClient } from '@supabase/ssr'

// Load environment variables
config({ path: '.env.local' })

async function testLogin() {
  console.log('🔍 Testing login functionality...')
  
  // Test environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  console.log('✅ Environment variables found')
  console.log('URL:', url)
  console.log('Key:', key.substring(0, 20) + '...')
  
  // Create Supabase client
  const supabase = createBrowserClient(url, key, {
    cookies: {
      get: () => null,
      set: () => {},
      remove: () => {}
    }
  })
  
  // Test login
  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'
  
  console.log('\n🔐 Testing login with:', email)
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ No user data returned')
      return
    }

    console.log('✅ Login successful!')
    console.log('User ID:', authData.user.id)
    console.log('Email:', authData.user.email)
    console.log('Session exists:', !!authData.session)
    
    if (authData.session) {
      console.log('Access token length:', authData.session.access_token.length)
      console.log('Refresh token length:', authData.session.refresh_token.length)
    }
    
    // Test employee data fetch
    console.log('\n👤 Testing employee data fetch...')
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active, unit_id')
      .eq('user_id', authData.user.id)
      .single()
    
    if (employeeError) {
      console.error('❌ Employee fetch failed:', employeeError.message)
      return
    }
    
    if (!employeeData) {
      console.error('❌ No employee data found')
      return
    }
    
    console.log('✅ Employee data found:')
    console.log('Name:', employeeData.full_name)
    console.log('Role:', employeeData.role)
    console.log('Active:', employeeData.is_active)
    console.log('Unit ID:', employeeData.unit_id)
    
    // Test user metadata
    console.log('\n📋 User metadata:')
    console.log(JSON.stringify(authData.user.user_metadata, null, 2))
    
  } catch (error) {
    console.error('❌ Exception during login test:', error)
  }
}

testLogin().catch(console.error)