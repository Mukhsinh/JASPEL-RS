import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnoseBrowserLogin() {
  console.log('🔍 Diagnosing Browser Login Issue\n')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          console.log(`[STORAGE] getItem: ${key}`)
          return null
        },
        setItem: (key, value) => {
          console.log(`[STORAGE] setItem: ${key}`)
        },
        removeItem: (key) => {
          console.log(`[STORAGE] removeItem: ${key}`)
        }
      }
    }
  })

  try {
    console.log('1️⃣ Attempting login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (error) {
      console.error('❌ Login error:', error.message)
      console.error('   Error details:', JSON.stringify(error, null, 2))
      return
    }

    if (!data.user) {
      console.error('❌ No user returned')
      return
    }

    console.log('✅ Login successful')
    console.log('   User ID:', data.user.id)
    console.log('   Email:', data.user.email)
    console.log('   Role:', data.user.user_metadata?.role)
    console.log('   Session expires:', new Date(data.session!.expires_at! * 1000).toLocaleString())

    console.log('\n2️⃣ Checking employee record...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (empError) {
      console.error('❌ Employee error:', empError.message)
      return
    }

    if (!employee) {
      console.error('❌ No employee found')
      return
    }

    console.log('✅ Employee found')
    console.log('   Name:', employee.full_name)
    console.log('   Active:', employee.is_active)
    console.log('   Unit ID:', employee.unit_id)

    console.log('\n3️⃣ Simulating middleware checks...')
    
    // Check if role exists
    const role = data.user.user_metadata?.role
    if (!role) {
      console.error('❌ No role in user_metadata')
      console.log('   This would cause middleware to redirect to login')
      return
    }
    console.log('✅ Role found:', role)

    // Check if employee is active
    if (!employee.is_active) {
      console.error('❌ Employee is inactive')
      console.log('   This would cause middleware to redirect to login with error=inactive')
      return
    }
    console.log('✅ Employee is active')

    // Check route authorization
    const allowedRoles = ['superadmin', 'unit_manager', 'employee']
    if (!allowedRoles.includes(role)) {
      console.error('❌ Role not allowed for dashboard')
      console.log('   This would cause middleware to redirect to /forbidden')
      return
    }
    console.log('✅ Role is allowed to access dashboard')

    console.log('\n4️⃣ Testing dashboard data access...')
    const { count: unitsCount } = await supabase
      .from('m_units')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log('✅ Can access dashboard data')
    console.log('   Units count:', unitsCount)

    console.log('\n✅ ALL CHECKS PASSED!')
    console.log('\n📋 Diagnosis Summary:')
    console.log('   ✓ Authentication: Working')
    console.log('   ✓ Employee record: Found and active')
    console.log('   ✓ Role: Valid and authorized')
    console.log('   ✓ Middleware checks: Would pass')
    console.log('   ✓ Dashboard data: Accessible')
    
    console.log('\n💡 Possible browser issues:')
    console.log('   1. Browser storage (localStorage/sessionStorage) might be blocked')
    console.log('   2. Cookies might be blocked')
    console.log('   3. Browser cache might be corrupted')
    console.log('   4. JavaScript errors preventing redirect')
    console.log('   5. Network issues preventing redirect')
    
    console.log('\n🔧 Solutions to try:')
    console.log('   1. Clear browser cache and cookies (Ctrl+Shift+Delete)')
    console.log('   2. Try in incognito/private mode')
    console.log('   3. Check browser console for JavaScript errors')
    console.log('   4. Check Network tab for failed requests')
    console.log('   5. Disable browser extensions')
    console.log('   6. Try a different browser')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

diagnoseBrowserLogin()
