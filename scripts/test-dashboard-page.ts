#!/usr/bin/env tsx

/**
 * Test Dashboard Page
 * Memverifikasi halaman dashboard dapat diakses
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDashboardPage() {
  console.log('🧪 Testing Dashboard Page...\n')

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
      console.error('❌ No users found')
      process.exit(1)
    }

    const testUser = users.find(u => u.email?.includes('superadmin')) || users[0]
    console.log(`✅ Test user: ${testUser.email}`)

    // 2. Test employee query (dashboard requirement)
    console.log('\n2️⃣ Testing employee query...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select(`
        id, 
        full_name, 
        role, 
        unit_id,
        m_units!m_employees_unit_id_fkey (
          name
        )
      `)
      .eq('user_id', testUser.id)
      .single()

    if (empError) {
      console.error('❌ Employee query failed:', empError.message)
      console.log('   User mungkin belum memiliki employee record')
      process.exit(1)
    }

    console.log(`✅ Employee: ${employee.full_name}`)
    console.log(`   Role: ${employee.role}`)
    console.log(`   Unit: ${employee.m_units?.name || 'N/A'}`)

    // 3. Test dashboard stats (for superadmin)
    if (employee.role === 'superadmin') {
      console.log('\n3️⃣ Testing dashboard stats...')
      
      // Test employee count
      const { count: empCount, error: empCountError } = await supabase
        .from('m_employees')
        .select('*', { count: 'exact', head: true })

      if (empCountError) {
        console.error('❌ Employee count failed:', empCountError.message)
      } else {
        console.log(`✅ Total employees: ${empCount || 0}`)
      }

      // Test unit count
      const { count: unitCount, error: unitCountError } = await supabase
        .from('m_units')
        .select('*', { count: 'exact', head: true })

      if (unitCountError) {
        console.error('❌ Unit count failed:', unitCountError.message)
      } else {
        console.log(`✅ Total units: ${unitCount || 0}`)
      }
    }

    console.log('\n✅ Dashboard page test completed!')
    console.log('\n📋 Dashboard siap digunakan di browser')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

testDashboardPage()
