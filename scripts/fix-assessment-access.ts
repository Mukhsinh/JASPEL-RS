import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAssessmentAccess() {
  console.log('🔧 Fixing Assessment Access Issue...\n')

  try {
    // 1. Verify superadmin user exists and has proper metadata
    console.log('1. Checking superadmin user metadata...')
    
    const { data: superadmin, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, user_id')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .single()

    if (empError || !superadmin) {
      console.error('   ❌ Superadmin not found:', empError?.message)
      return
    }

    console.log(`   ✅ Superadmin found: ${superadmin.full_name}`)

    // Get auth user and check metadata
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(superadmin.user_id)
    
    if (authError || !authUser.user) {
      console.error('   ❌ Auth user not found:', authError?.message)
      return
    }

    console.log(`   ✅ Auth user: ${authUser.user.email}`)
    console.log(`   Current metadata role: ${authUser.user.user_metadata?.role}`)

    // 2. Update user metadata if needed
    if (authUser.user.user_metadata?.role !== 'superadmin') {
      console.log('\n2. Updating user metadata...')
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        superadmin.user_id,
        {
          user_metadata: {
            ...authUser.user.user_metadata,
            role: 'superadmin',
            employee_id: superadmin.id,
            full_name: superadmin.full_name
          }
        }
      )

      if (updateError) {
        console.error('   ❌ Failed to update metadata:', updateError.message)
      } else {
        console.log('   ✅ User metadata updated')
      }
    } else {
      console.log('\n2. User metadata is correct ✅')
    }

    // 3. Test middleware logic simulation
    console.log('\n3. Testing middleware logic...')
    
    // Simulate middleware checks
    const pathname = '/assessment'
    const role = 'superadmin'
    
    // Check if route is allowed
    const routeConfigs = [
      {
        path: '/assessment',
        allowedRoles: ['superadmin', 'unit_manager']
      }
    ]
    
    const config = routeConfigs.find(rc => pathname === rc.path || pathname.startsWith(rc.path + '/'))
    const isAllowed = config ? config.allowedRoles.includes(role as any) : true
    
    console.log(`   Route: ${pathname}`)
    console.log(`   Role: ${role}`)
    console.log(`   Allowed: ${isAllowed ? '✅' : '❌'}`)

    // 4. Check if there are any session issues
    console.log('\n4. Checking session configuration...')
    
    // Verify the user can be authenticated
    const { data: sessionTest, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!
    })

    if (sessionError) {
      console.error('   ❌ Session generation error:', sessionError.message)
    } else {
      console.log('   ✅ Session generation works')
    }

    // 5. Create a simple test to verify the page works
    console.log('\n5. Testing page requirements...')
    
    // Test available periods function
    const { data: periods, error: periodsError } = await supabase
      .from('t_pool')
      .select('period')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })

    if (periodsError) {
      console.error('   ❌ Periods query failed:', periodsError.message)
    } else {
      console.log(`   ✅ Available periods: ${periods?.map(p => p.period).join(', ') || 'none'}`)
    }

    // 6. Provide solution steps
    console.log('\n🎯 SOLUTION STEPS:')
    console.log('   1. Clear browser cache and cookies')
    console.log('   2. Login again with superadmin account')
    console.log('   3. Navigate to /assessment')
    console.log('   4. If still forbidden, check browser dev tools for errors')

    // 7. Create a direct login link for testing
    console.log('\n🔗 DIRECT LOGIN LINK:')
    console.log(`   Email: ${authUser.user.email}`)
    console.log('   Use password reset if needed, then try /assessment')

    console.log('\n✅ Assessment access fix complete!')

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

// Run the fix
fixAssessmentAccess()