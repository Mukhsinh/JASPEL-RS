#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseLoginRedirectLoop() {
  console.log('🔍 Diagnosing Login Redirect Loop Issue...\n')

  try {
    // Test 1: Check if we can authenticate
    console.log('1️⃣ Testing authentication with test credentials...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ No user data returned from authentication')
      return
    }

    console.log('✅ Authentication successful')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Test 2: Check user metadata for role
    console.log('\n2️⃣ Checking user metadata for role...')
    const role = authData.user.user_metadata?.role || authData.user.raw_user_meta_data?.role
    
    if (!role) {
      console.error('❌ No role found in user metadata')
      console.log('   user_metadata:', JSON.stringify(authData.user.user_metadata, null, 2))
      console.log('   raw_user_meta_data:', JSON.stringify(authData.user.raw_user_meta_data, null, 2))
      
      // This is likely the issue - let's check if we need to set the role
      console.log('\n🔧 Attempting to fix missing role...')
      
      // Check if user exists in m_employees table
      const { data: employee, error: empError } = await supabase
        .from('m_employees')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()
      
      if (empError || !employee) {
        console.error('❌ Employee record not found:', empError?.message)
        return
      }
      
      console.log('✅ Employee record found:', {
        id: employee.id,
        name: employee.full_name,
        active: employee.is_active
      })
      
      // Determine role based on employee data or set default
      let userRole = 'employee' // default
      if (employee.full_name?.toLowerCase().includes('admin') || 
          authData.user.email === 'mukhsin9@gmail.com') {
        userRole = 'superadmin'
      }
      
      console.log(`🔧 Setting role to: ${userRole}`)
      
      // Update user metadata with role using admin client
      const adminSupabase = createClient(
        supabaseUrl, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        authData.user.id,
        {
          user_metadata: {
            role: userRole
          }
        }
      )
      
      if (updateError) {
        console.error('❌ Failed to update user role:', updateError.message)
        return
      }
      
      console.log('✅ User role updated successfully')
      
    } else {
      console.log('✅ Role found:', role)
    }

    // Test 3: Check employee record
    console.log('\n3️⃣ Checking employee record...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()

    if (empError) {
      console.error('❌ Employee fetch error:', empError.message)
      return
    }

    if (!employee) {
      console.error('❌ Employee record not found')
      return
    }

    console.log('✅ Employee record found:')
    console.log('   ID:', employee.id)
    console.log('   Name:', employee.full_name)
    console.log('   Unit ID:', employee.unit_id)
    console.log('   Active:', employee.is_active)

    if (!employee.is_active) {
      console.error('❌ Employee is inactive - this would cause redirect to login')
      return
    }

    // Test 4: Check session persistence
    console.log('\n4️⃣ Checking session persistence...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }

    if (!sessionData.session) {
      console.error('❌ No session found after login')
      return
    }

    console.log('✅ Session is valid')
    console.log('   Access token exists:', !!sessionData.session.access_token)
    console.log('   Refresh token exists:', !!sessionData.session.refresh_token)
    console.log('   Expires at:', new Date(sessionData.session.expires_at! * 1000).toISOString())

    // Test 5: Test middleware logic simulation
    console.log('\n5️⃣ Simulating middleware checks...')
    
    const userRole = sessionData.session.user.user_metadata?.role
    if (!userRole) {
      console.error('❌ Role still not found in session - middleware would redirect to login')
      return
    }
    
    console.log('✅ Role found in session:', userRole)
    
    if (!employee.is_active) {
      console.error('❌ Employee inactive - middleware would redirect to login')
      return
    }
    
    console.log('✅ Employee is active - middleware should allow access')

    // Clean up
    await supabase.auth.signOut()
    console.log('\n✅ All checks passed! Login should work correctly now.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

diagnoseLoginRedirectLoop()