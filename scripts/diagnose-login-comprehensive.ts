/**
 * Comprehensive login diagnosis
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function comprehensiveDiagnosis() {
  console.log('🔍 COMPREHENSIVE LOGIN DIAGNOSIS\n')
  console.log('=' .repeat(60))

  // Test 1: Environment variables
  console.log('\n1️⃣ CHECKING ENVIRONMENT VARIABLES')
  console.log('-'.repeat(60))
  console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  console.log('Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Missing required environment variables!')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Test 2: Database connection
  console.log('\n2️⃣ TESTING DATABASE CONNECTION')
  console.log('-'.repeat(60))
  try {
    const { data, error } = await supabase.from('m_units').select('count').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error.message)
    } else {
      console.log('✅ Database connection successful')
    }
  } catch (err: any) {
    console.error('❌ Database connection error:', err.message)
  }

  // Test 3: Auth user exists
  console.log('\n3️⃣ CHECKING AUTH USER')
  console.log('-'.repeat(60))
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Failed to list users:', error.message)
    } else {
      const testUser = users.users.find(u => u.email === 'mukhsin9@gmail.com')
      if (testUser) {
        console.log('✅ Auth user found')
        console.log('   User ID:', testUser.id)
        console.log('   Email:', testUser.email)
        console.log('   Email confirmed:', testUser.email_confirmed_at ? '✅ Yes' : '❌ No')
        console.log('   Created:', new Date(testUser.created_at).toLocaleString())
        console.log('   Last sign in:', testUser.last_sign_in_at ? new Date(testUser.last_sign_in_at).toLocaleString() : 'Never')
        console.log('   User metadata:', JSON.stringify(testUser.user_metadata, null, 2))
      } else {
        console.error('❌ Auth user not found')
      }
    }
  } catch (err: any) {
    console.error('❌ Error checking auth user:', err.message)
  }

  // Test 4: Employee record
  console.log('\n4️⃣ CHECKING EMPLOYEE RECORD')
  console.log('-'.repeat(60))
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.listUsers()
    const testUser = authUser.users.find(u => u.email === 'mukhsin9@gmail.com')
    
    if (testUser) {
      const { data: employee, error } = await supabase
        .from('m_employees')
        .select('*, m_units(name)')
        .eq('user_id', testUser.id)
        .single()
      
      if (error) {
        console.error('❌ Employee record not found:', error.message)
      } else if (employee) {
        console.log('✅ Employee record found')
        console.log('   ID:', employee.id)
        console.log('   Name:', employee.full_name)
        console.log('   Role:', employee.role)
        console.log('   Active:', employee.is_active ? '✅ Yes' : '❌ No')
        console.log('   Unit:', employee.m_units?.name || 'N/A')
        console.log('   User ID:', employee.user_id)
      }
    }
  } catch (err: any) {
    console.error('❌ Error checking employee:', err.message)
  }

  // Test 5: Login attempt
  console.log('\n5️⃣ TESTING LOGIN')
  console.log('-'.repeat(60))
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      console.error('   Error code:', authError.status)
      console.error('   Error name:', authError.name)
    } else if (authData.user && authData.session) {
      console.log('✅ Login successful')
      console.log('   User ID:', authData.user.id)
      console.log('   Email:', authData.user.email)
      console.log('   Session expires:', new Date(authData.session.expires_at! * 1000).toLocaleString())
      
      // Test 6: Session verification
      console.log('\n6️⃣ VERIFYING SESSION')
      console.log('-'.repeat(60))
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('❌ Session verification failed')
      } else {
        console.log('✅ Session verified')
        console.log('   Access token length:', session.access_token.length)
        console.log('   Refresh token length:', session.refresh_token.length)
      }

      // Test 7: Employee data with session
      console.log('\n7️⃣ FETCHING EMPLOYEE DATA WITH SESSION')
      console.log('-'.repeat(60))
      const { data: empData, error: empError } = await supabase
        .from('m_employees')
        .select('id, full_name, role, is_active, unit_id, m_units(name)')
        .eq('user_id', authData.user.id)
        .single()
      
      if (empError) {
        console.error('❌ Failed to fetch employee data:', empError.message)
        console.error('   Error code:', empError.code)
        console.error('   Error details:', empError.details)
      } else if (empData) {
        console.log('✅ Employee data fetched')
        console.log('   Name:', empData.full_name)
        console.log('   Role:', empData.role)
        console.log('   Active:', empData.is_active)
      }

      // Clean up
      await supabase.auth.signOut()
    }
  } catch (err: any) {
    console.error('❌ Login test error:', err.message)
  }

  // Test 8: RLS Policies
  console.log('\n8️⃣ CHECKING RLS POLICIES')
  console.log('-'.repeat(60))
  try {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'm_employees')
    
    if (error) {
      console.log('⚠️  Could not check RLS policies (expected in some setups)')
    } else if (policies) {
      console.log(`✅ Found ${policies.length} RLS policies for m_employees`)
      policies.forEach((p: any) => {
        console.log(`   - ${p.policyname}: ${p.cmd}`)
      })
    }
  } catch (err: any) {
    console.log('⚠️  RLS policy check skipped')
  }

  // Test 9: Middleware simulation
  console.log('\n9️⃣ SIMULATING MIDDLEWARE FLOW')
  console.log('-'.repeat(60))
  try {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authData.user) {
      // Check role from user_metadata
      const role = authData.user.user_metadata?.role
      console.log('Role from user_metadata:', role || '❌ Not found')
      
      if (!role) {
        console.error('❌ CRITICAL: Role not in user_metadata!')
        console.log('   This will cause middleware to fail')
        console.log('   User metadata:', JSON.stringify(authData.user.user_metadata, null, 2))
      } else {
        console.log('✅ Role found in user_metadata')
      }

      // Check employee record
      const { data: emp } = await supabase
        .from('m_employees')
        .select('is_active')
        .eq('user_id', authData.user.id)
        .maybeSingle()
      
      if (!emp) {
        console.error('❌ CRITICAL: Employee record not found!')
        console.log('   This will cause middleware to redirect to login')
      } else if (!emp.is_active) {
        console.error('❌ CRITICAL: Employee is inactive!')
        console.log('   This will cause middleware to redirect to login')
      } else {
        console.log('✅ Employee is active')
      }

      await supabase.auth.signOut()
    }
  } catch (err: any) {
    console.error('❌ Middleware simulation error:', err.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('DIAGNOSIS COMPLETE')
  console.log('='.repeat(60))
}

comprehensiveDiagnosis()
