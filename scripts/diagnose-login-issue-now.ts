#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseLoginIssue() {
  console.log('🔍 Diagnosing login issue...')
  
  // Test 1: Basic connection
  console.log('\n1. Testing Supabase connection...')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data, error } = await supabase.from('m_employees').select('count').limit(1)
    if (error) {
      console.error('❌ Connection failed:', error.message)
    } else {
      console.log('✅ Connection successful')
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
  }
  
  // Test 2: Check if test user exists
  console.log('\n2. Checking test user...')
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ Failed to list users:', authError.message)
      return
    }
    
    const testUser = authUser.users.find(u => u.email === 'mukhsin9@gmail.com')
    if (!testUser) {
      console.log('❌ Test user not found in auth.users')
      return
    }
    
    console.log('✅ Test user found in auth:', testUser.id)
    console.log('   - Email confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('   - User metadata:', JSON.stringify(testUser.user_metadata, null, 2))
    
    // Test 3: Check employee record
    console.log('\n3. Checking employee record...')
    const { data: employee, error: empError } = await adminSupabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .single()
    
    if (empError) {
      console.error('❌ Employee record not found:', empError.message)
    } else {
      console.log('✅ Employee record found:')
      console.log('   - ID:', employee.id)
      console.log('   - Name:', employee.full_name)
      console.log('   - Active:', employee.is_active)
      console.log('   - Role:', employee.role)
    }
    
    // Test 4: Try login
    console.log('\n4. Testing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
    } else {
      console.log('✅ Login successful')
      console.log('   - User ID:', loginData.user?.id)
      console.log('   - Session exists:', !!loginData.session)
      console.log('   - Access token length:', loginData.session?.access_token?.length || 0)
    }
    
  } catch (err) {
    console.error('❌ Diagnosis error:', err)
  }
}

diagnoseLoginIssue().catch(console.error)