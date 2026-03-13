import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifyMUsersTable() {
  console.log('🔍 Verifying m_users table...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 1. Check if table exists
  console.log('1. Checking if m_users table exists...')
  const { data: tables, error: tablesError } = await supabase
    .from('m_users')
    .select('id')
    .limit(1)

  if (tablesError) {
    console.error('❌ Error accessing m_users table:', tablesError.message)
    console.error('   This might mean the table does not exist or RLS is blocking access')
    return
  }

  console.log('✓ m_users table exists and is accessible\n')

  // 2. Count users
  console.log('2. Counting users in m_users...')
  const { count, error: countError } = await supabase
    .from('m_users')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error counting users:', countError.message)
  } else {
    console.log(`✓ Found ${count} users in m_users\n`)
  }

  // 3. Get sample users
  console.log('3. Fetching sample users...')
  const { data: users, error: usersError } = await supabase
    .from('m_users')
    .select('id, email, role, created_at')
    .limit(5)

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message)
  } else {
    console.log('✓ Sample users:')
    users?.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`)
    })
    console.log()
  }

  // 4. Check auth.users
  console.log('4. Checking auth.users...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message)
  } else {
    console.log(`✓ Found ${authData.users.length} users in auth.users`)
    authData.users.forEach(user => {
      console.log(`  - ${user.email} - ID: ${user.id}`)
    })
    console.log()
  }

  // 5. Check for mismatches
  if (users && authData) {
    console.log('5. Checking for ID mismatches...')
    const authIds = new Set(authData.users.map(u => u.id))
    const userIds = new Set(users.map(u => u.id))

    const inAuthNotInUsers = authData.users.filter(au => !userIds.has(au.id))
    const inUsersNotInAuth = users.filter(u => !authIds.has(u.id))

    if (inAuthNotInUsers.length > 0) {
      console.log('⚠️  Users in auth but not in m_users:')
      inAuthNotInUsers.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    }

    if (inUsersNotInAuth.length > 0) {
      console.log('⚠️  Users in m_users but not in auth:')
      inUsersNotInAuth.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    }

    if (inAuthNotInUsers.length === 0 && inUsersNotInAuth.length === 0) {
      console.log('✓ All user IDs match between auth and m_users')
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Verification complete!')
}

verifyMUsersTable().catch(console.error)
