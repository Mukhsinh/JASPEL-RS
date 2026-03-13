import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

async function diagnoseKPIConfigError() {
  console.log('🔍 Diagnosing KPI Config Error...\n')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Check if m_users table exists and has data
    console.log('1. Checking m_users table...')
    const { data: users, error: usersError } = await supabase
      .from('m_users')
      .select('id, email, role')
      .limit(5)

    if (usersError) {
      console.error('❌ Error querying m_users:', usersError.message)
      console.error('   Details:', usersError)
    } else {
      console.log(`✓ Found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        console.log('   Sample users:', users)
      }
    }

    // 2. Check auth.users
    console.log('\n2. Checking auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error querying auth.users:', authError.message)
    } else {
      console.log(`✓ Found ${authUsers.users.length} auth users`)
      authUsers.users.slice(0, 3).forEach(u => {
        console.log(`   - ${u.email} (${u.id})`)
      })
    }

    // 3. Check if there's a mismatch between auth.users and m_users
    console.log('\n3. Checking for ID mismatches...')
    if (authUsers && users) {
      const authIds = new Set(authUsers.users.map(u => u.id))
      const userIds = new Set(users.map(u => u.id))
      
      const inAuthNotInUsers = authUsers.users.filter(u => !userIds.has(u.id))
      const inUsersNotInAuth = users.filter(u => !authIds.has(u.id))
      
      if (inAuthNotInUsers.length > 0) {
        console.log('⚠ Users in auth.users but not in m_users:')
        inAuthNotInUsers.forEach(u => console.log(`   - ${u.email} (${u.id})`))
      }
      
      if (inUsersNotInAuth.length > 0) {
        console.log('⚠ Users in m_users but not in auth.users:')
        inUsersNotInAuth.forEach(u => console.log(`   - ${u.email} (${u.id})`))
      }
      
      if (inAuthNotInUsers.length === 0 && inUsersNotInAuth.length === 0) {
        console.log('✓ All user IDs match between auth.users and m_users')
      }
    }

    // 4. Test the actual query that the API uses
    console.log('\n4. Testing API query pattern...')
    if (authUsers && authUsers.users.length > 0) {
      const testUser = authUsers.users[0]
      console.log(`   Testing with user: ${testUser.email}`)
      
      const { data: profile, error: profileError } = await supabase
        .from('m_users')
        .select('role')
        .eq('id', testUser.id)
        .single()
      
      if (profileError) {
        console.error('❌ Error getting profile:', profileError.message)
        console.error('   Details:', profileError)
      } else {
        console.log('✓ Profile query successful:', profile)
      }
    }

    // 5. Check table structure
    console.log('\n5. Checking m_users table structure...')
    const { data: columns, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'm_users' })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return supabase
          .from('m_users')
          .select('*')
          .limit(1)
      })
    
    if (structureError) {
      console.log('⚠ Could not get table structure (this is OK)')
    } else {
      console.log('✓ Table structure check passed')
    }

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error('Stack:', error.stack)
  }
}

diagnoseKPIConfigError()
