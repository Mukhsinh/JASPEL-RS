#!/usr/bin/env tsx

/**
 * Test Notification API
 * Memverifikasi API notifications berfungsi dengan baik
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testNotificationAPI() {
  console.log('🧪 Testing Notification API...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Get test user
    console.log('1️⃣ Getting test user...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️  No users found for testing')
      return
    }

    const testUser = users.find(u => u.email?.includes('superadmin')) || users[0]
    console.log(`✅ Test user: ${testUser.email}`)

    // 2. Test notification count query
    console.log('\n2️⃣ Testing notification count...')
    const { count, error: countError } = await supabase
      .from('t_notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUser.id)
      .eq('read', false)

    if (countError) {
      console.error('❌ Count query failed:', countError.message)
      
      // Check if table exists
      const { error: tableError } = await supabase
        .from('t_notification')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.error('❌ Table t_notification tidak ada atau tidak accessible')
        console.log('   Jalankan: npx tsx scripts/fix-dashboard-errors.ts')
        process.exit(1)
      }
    } else {
      console.log(`✅ Unread count: ${count || 0}`)
    }

    // 3. Test notification list query
    console.log('\n3️⃣ Testing notification list...')
    const { data: notifications, error: listError } = await supabase
      .from('t_notification')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (listError) {
      console.error('❌ List query failed:', listError.message)
    } else {
      console.log(`✅ Found ${notifications?.length || 0} notifications`)
    }

    console.log('\n✅ Notification API test completed!')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

testNotificationAPI()
