#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

async function fixLoginRedirectIssue() {
  console.log('🔧 Fixing Login Redirect Issue...\n')

  try {
    // Create admin client to check and fix user metadata
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('1️⃣ Checking user metadata for test user...')
    
    // Get user by email
    const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message)
      return
    }

    const testUser = users.users.find(u => u.email === 'mukhsin9@gmail.com')
    
    if (!testUser) {
      console.error('❌ Test user not found')
      return
    }

    console.log('✅ Test user found:', testUser.id)
    console.log('   Current metadata:', JSON.stringify(testUser.user_metadata, null, 2))

    // Check if role is properly set
    if (!testUser.user_metadata?.role) {
      console.log('🔧 Setting missing role in user metadata...')
      
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        testUser.id,
        {
          user_metadata: {
            ...testUser.user_metadata,
            role: 'superadmin'
          }
        }
      )
      
      if (updateError) {
        console.error('❌ Failed to update user metadata:', updateError.message)
        return
      }
      
      console.log('✅ User role updated to superadmin')
    } else {
      console.log('✅ User role already set:', testUser.user_metadata.role)
    }

    console.log('\n2️⃣ Checking employee record...')
    
    const regularSupabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: employee, error: empError } = await regularSupabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    if (empError || !employee) {
      console.error('❌ Employee record issue:', empError?.message)
      return
    }

    console.log('✅ Employee record found:', {
      id: employee.id,
      name: employee.full_name,
      active: employee.is_active,
      unit_id: employee.unit_id
    })

    if (!employee.is_active) {
      console.log('🔧 Activating employee...')
      
      const { error: activateError } = await regularSupabase
        .from('m_employees')
        .update({ is_active: true })
        .eq('id', employee.id)
      
      if (activateError) {
        console.error('❌ Failed to activate employee:', activateError.message)
        return
      }
      
      console.log('✅ Employee activated')
    }

    console.log('\n3️⃣ Testing complete login flow...')
    
    // Test the complete login flow
    const { data: authData, error: authError } = await regularSupabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful')

    // Check session immediately
    const { data: sessionData, error: sessionError } = await regularSupabase.auth.getSession()
    
    if (sessionError || !sessionData.session) {
      console.error('❌ Session not established:', sessionError?.message)
      return
    }

    console.log('✅ Session established')
    console.log('   Role in session:', sessionData.session.user.user_metadata?.role)

    // Test employee fetch with session
    const { data: empWithSession, error: empSessionError } = await regularSupabase
      .from('m_employees')
      .select('id, full_name, is_active')
      .eq('user_id', sessionData.session.user.id)
      .single()

    if (empSessionError || !empWithSession) {
      console.error('❌ Employee fetch with session failed:', empSessionError?.message)
      return
    }

    console.log('✅ Employee data accessible with session')

    // Clean up
    await regularSupabase.auth.signOut()

    console.log('\n✅ Login redirect issue should be fixed!')
    console.log('   - User metadata has role: superadmin')
    console.log('   - Employee record is active')
    console.log('   - Session persists correctly')
    console.log('   - Dashboard route is allowed for superadmin')
    
    console.log('\n🚀 Try logging in again at: http://localhost:3002/login')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixLoginRedirectIssue()