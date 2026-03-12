import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseLoginRedirect() {
  console.log('🔍 DIAGNOSIS LOGIN REDIRECT ISSUE\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. Check test user exists in auth.users
    console.log('\n1️⃣ Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
    
    if (!testUser) {
      console.error('❌ Test user not found in auth.users')
      return
    }
    
    console.log('✅ Test user found in auth.users')
    console.log('   User ID:', testUser.id)
    console.log('   Email:', testUser.email)
    console.log('   Email confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('   Created:', testUser.created_at)
    console.log('   Last sign in:', testUser.last_sign_in_at || 'Never')
    
    // Check user_metadata
    console.log('\n2️⃣ Checking user_metadata...')
    console.log('   user_metadata:', JSON.stringify(testUser.user_metadata, null, 2))
    console.log('   raw_user_meta_data:', JSON.stringify(testUser.raw_user_meta_data, null, 2))
    
    const role = testUser.user_metadata?.role || testUser.raw_user_meta_data?.role
    
    if (!role) {
      console.error('❌ Role not found in user_metadata')
      console.log('\n🔧 FIXING: Adding role to user_metadata...')
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        {
          user_metadata: {
            ...testUser.user_metadata,
            role: 'superadmin'
          }
        }
      )
      
      if (updateError) {
        console.error('❌ Failed to update user_metadata:', updateError.message)
      } else {
        console.log('✅ Role added to user_metadata')
      }
    } else {
      console.log('✅ Role found:', role)
    }
    
    // 3. Check m_employees table
    console.log('\n3️⃣ Checking m_employees table...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle()
    
    if (empError) {
      console.error('❌ Error fetching employee:', empError.message)
      return
    }
    
    if (!employee) {
      console.error('❌ Employee record not found for user_id:', testUser.id)
      console.log('\n🔧 FIXING: Creating employee record...')
      
      const { data: newEmployee, error: createError } = await supabase
        .from('m_employees')
        .insert({
          user_id: testUser.id,
          employee_code: 'ADMIN001',
          full_name: 'Superadmin',
          unit_id: null,
          tax_status: 'TK/0',
          is_active: true
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Failed to create employee:', createError.message)
      } else {
        console.log('✅ Employee record created:', newEmployee.id)
      }
    } else {
      console.log('✅ Employee record found')
      console.log('   Employee ID:', employee.id)
      console.log('   Employee Code:', employee.employee_code)
      console.log('   Full Name:', employee.full_name)
      console.log('   Unit ID:', employee.unit_id || 'null (superadmin)')
      console.log('   Is Active:', employee.is_active)
      
      if (!employee.is_active) {
        console.log('\n🔧 FIXING: Activating employee...')
        const { error: activateError } = await supabase
          .from('m_employees')
          .update({ is_active: true })
          .eq('id', employee.id)
        
        if (activateError) {
          console.error('❌ Failed to activate employee:', activateError.message)
        } else {
          console.log('✅ Employee activated')
        }
      }
    }
    
    // 4. Test authentication flow
    console.log('\n4️⃣ Testing authentication flow...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n🔧 FIXING: Resetting password...')
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          testUser.id,
          { password: 'admin123' }
        )
        
        if (resetError) {
          console.error('❌ Failed to reset password:', resetError.message)
        } else {
          console.log('✅ Password reset to: admin123')
        }
      }
    } else {
      console.log('✅ Sign in successful')
      console.log('   Session created:', !!signInData.session)
      console.log('   Access token:', signInData.session?.access_token ? 'Present' : 'Missing')
      console.log('   Refresh token:', signInData.session?.refresh_token ? 'Present' : 'Missing')
      
      // Sign out after test
      await supabase.auth.signOut()
    }
    
    // 5. Check RLS policies
    console.log('\n5️⃣ Checking RLS policies on m_employees...')
    const { data: policies, error: policyError } = await supabase
      .rpc('pg_policies')
      .eq('tablename', 'm_employees')
    
    if (policyError) {
      console.log('⚠️  Could not check RLS policies (this is OK)')
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies found:', policies.length)
      policies.forEach((p: any) => {
        console.log(`   - ${p.policyname}: ${p.cmd}`)
      })
    }
    
    // 6. Summary and recommendations
    console.log('\n' + '='.repeat(60))
    console.log('📋 SUMMARY & RECOMMENDATIONS\n')
    
    console.log('✅ Checks completed. If login still fails, check:')
    console.log('   1. Browser console for JavaScript errors')
    console.log('   2. Network tab for failed API calls')
    console.log('   3. Middleware logs in terminal')
    console.log('   4. Clear browser cookies and localStorage')
    console.log('   5. Try incognito/private browsing mode')
    
    console.log('\n🔑 Test credentials:')
    console.log('   Email: mukhsin9@gmail.com')
    console.log('   Password: admin123')
    
    console.log('\n✅ Diagnosis complete!')
    
  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error(error)
  }
}

diagnoseLoginRedirect()
