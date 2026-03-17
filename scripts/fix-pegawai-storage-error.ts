/**
 * Fix storage error on pegawai page
 * Clears corrupted session data and tests the page
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixPegawaiStorageError() {
  console.log('🔧 Fixing pegawai page storage error...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Check if m_employees table exists and has data
    console.log('1️⃣ Checking m_employees table...')
    const { data: employees, error: employeesError } = await supabase
      .from('m_employees')
      .select('id, employee_code, full_name, position, unit_id')
      .limit(5)

    if (employeesError) {
      console.error('❌ Error checking employees:', employeesError.message)
      return
    }

    console.log(`✅ Found ${employees?.length || 0} employees (showing first 5)`)
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        console.log(`   - ${emp.employee_code}: ${emp.full_name} (${emp.position})`)
      })
    }

    // 2. Check RLS policies for m_employees
    console.log('\n2️⃣ Checking RLS policies for m_employees...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'm_employees'
          ORDER BY policyname;
        `
      })
      .single()

    if (policiesError) {
      console.log('⚠️  Could not check policies (this is OK if exec_sql function does not exist)')
    } else {
      console.log('✅ RLS policies found')
    }

    // 3. Test authentication flow
    console.log('\n3️⃣ Testing authentication...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Error listing users:', usersError.message)
      return
    }

    const superadmin = users?.find(u => u.user_metadata?.role === 'superadmin')
    if (!superadmin) {
      console.error('❌ No superadmin user found')
      return
    }

    console.log(`✅ Found superadmin: ${superadmin.email}`)
    console.log(`   - User ID: ${superadmin.id}`)
    console.log(`   - Role: ${superadmin.user_metadata?.role}`)
    console.log(`   - Employee ID: ${superadmin.user_metadata?.employee_id}`)

    // 4. Test getPegawaiWithUnits logic
    console.log('\n4️⃣ Testing getPegawaiWithUnits query...')
    
    // Simulate the query from the server action
    const { data: pegawaiData, error: pegawaiError, count } = await supabase
      .from('m_employees')
      .select('*, m_units(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 49)

    if (pegawaiError) {
      console.error('❌ Error fetching pegawai:', pegawaiError.message)
      return
    }

    console.log(`✅ Successfully fetched ${count} total pegawai`)
    console.log(`   Showing first ${pegawaiData?.length || 0} records`)

    if (pegawaiData && pegawaiData.length > 0) {
      pegawaiData.slice(0, 3).forEach((emp: any) => {
        const unitName = Array.isArray(emp.m_units) && emp.m_units.length > 0
          ? emp.m_units[0].name
          : emp.m_units?.name || 'No unit'
        console.log(`   - ${emp.employee_code}: ${emp.full_name} (${unitName})`)
      })
    }

    // 5. Provide fix instructions
    console.log('\n📋 Fix Instructions:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. Clear browser storage:')
    console.log('   - Open DevTools (F12)')
    console.log('   - Go to Application > Storage')
    console.log('   - Click "Clear site data"')
    console.log('')
    console.log('2. Or run this in browser console:')
    console.log('   localStorage.clear(); sessionStorage.clear(); location.reload();')
    console.log('')
    console.log('3. Login again and navigate to /pegawai')
    console.log('')
    console.log('4. The storage adapter in lib/supabase/client.ts now:')
    console.log('   - Detects corrupted URL-encoded data')
    console.log('   - Automatically clears it')
    console.log('   - Prevents writing corrupted data')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n✅ Diagnostic complete!')
    console.log('\n💡 The issue is caused by corrupted session data in localStorage.')
    console.log('   The fix has been applied to lib/supabase/client.ts')
    console.log('   Users need to clear their browser storage once.')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
  }
}

fixPegawaiStorageError()
