#!/usr/bin/env tsx

/**
 * Script untuk memperbaiki masalah login redirect
 * User berhasil login tapi diarahkan kembali ke halaman login
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testLoginFlow() {
  console.log('🔍 Testing login flow...')
  
  try {
    // Test dengan kredensial yang ada di login page
    const email = 'mukhsin9@gmail.com'
    const password = 'admin123'
    
    console.log(`📧 Testing login with: ${email}`)
    
    // 1. Cek apakah user ada di auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    const authUser = authUsers.users.find(u => u.email === email)
    if (!authUser) {
      console.error('❌ User not found in auth.users')
      return
    }
    
    console.log('✅ User found in auth.users:', authUser.id)
    console.log('📋 User metadata:', authUser.user_metadata)
    
    // 2. Cek apakah user ada di m_employees
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    
    if (empError) {
      console.error('❌ Error fetching employee:', empError.message)
      return
    }
    
    if (!employee) {
      console.error('❌ Employee record not found')
      return
    }
    
    console.log('✅ Employee record found:', {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      is_active: employee.is_active,
      unit_id: employee.unit_id
    })
    
    // 3. Cek apakah role ada di user_metadata
    if (!authUser.user_metadata?.role) {
      console.log('⚠️  Role missing in user_metadata, updating...')
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          user_metadata: {
            ...authUser.user_metadata,
            role: employee.role,
            name: employee.name,
            unit_id: employee.unit_id
          }
        }
      )
      
      if (updateError) {
        console.error('❌ Error updating user metadata:', updateError.message)
        return
      }
      
      console.log('✅ User metadata updated with role:', employee.role)
    } else {
      console.log('✅ Role found in user_metadata:', authUser.user_metadata.role)
    }
    
    // 4. Test actual login
    console.log('\n🔐 Testing actual login...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('📋 Session info:', {
      user_id: loginData.user?.id,
      email: loginData.user?.email,
      role: loginData.user?.user_metadata?.role
    })
    
    // 5. Test session persistence
    console.log('\n💾 Testing session persistence...')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }
    
    if (sessionData.session) {
      console.log('✅ Session persisted successfully')
    } else {
      console.log('⚠️  Session not found after login')
    }
    
    // Cleanup - sign out
    await supabase.auth.signOut()
    
    console.log('\n✅ Login flow test completed successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function main() {
  console.log('🚀 Starting login redirect issue diagnosis...\n')
  
  await testLoginFlow()
  
  console.log('\n📋 Recommendations:')
  console.log('1. Pastikan user_metadata memiliki role yang benar')
  console.log('2. Periksa middleware untuk session validation timing')
  console.log('3. Gunakan window.location.replace() instead of href untuk redirect')
  console.log('4. Tambahkan retry logic di middleware untuk session check')
}

if (require.main === module) {
  main().catch(console.error)
}