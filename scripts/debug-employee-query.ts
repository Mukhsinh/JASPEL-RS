/**
 * Debug employee query issue
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function debugEmployeeQuery() {
  console.log('🔍 DEBUGGING EMPLOYEE QUERY\n')

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Get test user
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')

  if (!testUser) {
    console.error('❌ Test user not found')
    return
  }

  console.log('Test user ID:', testUser.id)
  console.log()

  // Test 1: Query WITHOUT auth (using service role)
  console.log('1️⃣ Query with SERVICE ROLE (no RLS)')
  console.log('-'.repeat(60))
  try {
    const { data, error, count } = await supabaseAdmin
      .from('m_employees')
      .select('*, m_units(name)', { count: 'exact' })
      .eq('user_id', testUser.id)
    
    console.log('Count:', count)
    console.log('Error:', error?.message || 'None')
    console.log('Data:', data ? `${data.length} record(s)` : 'None')
    if (data && data.length > 0) {
      data.forEach((emp, idx) => {
        console.log(`  Record ${idx + 1}:`, emp.full_name, '-', emp.role)
      })
    }
  } catch (err: any) {
    console.error('Exception:', err.message)
  }

  // Test 2: Query WITH auth (using anon key, no session)
  console.log('\n2️⃣ Query with ANON KEY (RLS active, NO session)')
  console.log('-'.repeat(60))
  try {
    const { data, error, count } = await supabaseAnon
      .from('m_employees')
      .select('*, m_units(name)', { count: 'exact' })
      .eq('user_id', testUser.id)
    
    console.log('Count:', count)
    console.log('Error:', error?.message || 'None')
    console.log('Data:', data ? `${data.length} record(s)` : 'None')
  } catch (err: any) {
    console.error('Exception:', err.message)
  }

  // Test 3: Login and query WITH session
  console.log('\n3️⃣ Query with ANON KEY (RLS active, WITH session)')
  console.log('-'.repeat(60))
  try {
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user) {
      console.error('Login failed:', authError?.message)
    } else {
      console.log('✅ Logged in as:', authData.user.email)
      
      const { data, error, count } = await supabaseAnon
        .from('m_employees')
        .select('*, m_units(name)', { count: 'exact' })
        .eq('user_id', authData.user.id)
      
      console.log('Count:', count)
      console.log('Error:', error?.message || 'None')
      console.log('Data:', data ? `${data.length} record(s)` : 'None')
      if (data && data.length > 0) {
        data.forEach((emp, idx) => {
          console.log(`  Record ${idx + 1}:`, emp.full_name, '-', emp.role)
        })
      }

      // Test .single()
      console.log('\n  Testing .single():')
      const { data: singleData, error: singleError } = await supabaseAnon
        .from('m_employees')
        .select('*, m_units(name)')
        .eq('user_id', authData.user.id)
        .single()
      
      console.log('  Error:', singleError?.message || 'None')
      console.log('  Data:', singleData ? `${singleData.full_name}` : 'None')

      // Test .maybeSingle()
      console.log('\n  Testing .maybeSingle():')
      const { data: maybeData, error: maybeError } = await supabaseAnon
        .from('m_employees')
        .select('*, m_units(name)')
        .eq('user_id', authData.user.id)
        .maybeSingle()
      
      console.log('  Error:', maybeError?.message || 'None')
      console.log('  Data:', maybeData ? `${maybeData.full_name}` : 'None')

      await supabaseAnon.auth.signOut()
    }
  } catch (err: any) {
    console.error('Exception:', err.message)
  }

  // Test 4: Check RLS policies
  console.log('\n4️⃣ Checking RLS status')
  console.log('-'.repeat(60))
  try {
    const { data: tableInfo } = await supabaseAdmin
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'm_employees')
      .single()
    
    if (tableInfo) {
      console.log('Table exists:', tableInfo.tablename)
      console.log('Schema:', tableInfo.schemaname)
    }

    // Check if RLS is enabled
    const { data: rlsInfo } = await supabaseAdmin.rpc('check_rls_enabled', {
      table_name: 'm_employees'
    }).single().catch(() => ({ data: null }))

    console.log('RLS enabled:', rlsInfo ? 'Yes' : 'Unknown')
  } catch (err: any) {
    console.log('RLS check skipped')
  }
}

debugEmployeeQuery()
