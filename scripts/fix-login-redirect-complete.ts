import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixLoginRedirect() {
  console.log('🔧 FIXING LOGIN REDIRECT ISSUE\n')
  
  try {
    // Get test user
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')
    
    if (!testUser) {
      console.error('❌ Test user not found')
      return
    }
    
    console.log('✅ Found user:', testUser.email)
    
    // Ensure user_metadata has role
    console.log('\n1️⃣ Updating user_metadata...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      testUser.id,
      {
        user_metadata: {
          role: 'superadmin',
          email_verified: true
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Failed to update metadata:', updateError.message)
    } else {
      console.log('✅ User metadata updated')
    }
    
    // Ensure employee record exists and is active
    console.log('\n2️⃣ Checking employee record...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle()
    
    if (empError) {
      console.error('❌ Error:', empError.message)
      return
    }
    
    if (!employee) {
      console.log('Creating employee record...')
      const { error: createError } = await supabase
        .from('m_employees')
        .insert({
          user_id: testUser.id,
          employee_code: 'ADMIN001',
          full_name: 'Superadmin',
          unit_id: null,
          tax_status: 'TK/0',
          is_active: true
        })
      
      if (createError) {
        console.error('❌ Failed:', createError.message)
      } else {
        console.log('✅ Employee created')
      }
    } else {
      console.log('✅ Employee exists:', employee.full_name)
      
      if (!employee.is_active) {
        await supabase
          .from('m_employees')
          .update({ is_active: true })
          .eq('id', employee.id)
        console.log('✅ Employee activated')
      }
    }
    
    console.log('\n✅ All fixes applied!')
    console.log('\n🔑 Try logging in with:')
    console.log('   Email: mukhsin9@gmail.com')
    console.log('   Password: admin123')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

fixLoginRedirect()
