#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function verifyLoginFixComplete() {
  console.log('🔍 Verifying login fix is complete...')
  
  try {
    const supabase = createClient(supabaseUrl, anonKey)
    
    console.log('1. Testing authentication flow...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123',
    })

    if (authError || !authData.user) {
      console.error('❌ Authentication failed:', authError)
      return false
    }

    console.log('✅ Authentication successful')
    
    console.log('2. Verifying user metadata...')
    const role = authData.user.user_metadata?.role
    const fullName = authData.user.user_metadata?.full_name
    
    if (!role || !fullName) {
      console.error('❌ Missing user metadata')
      await supabase.auth.signOut()
      return false
    }
    
    console.log('✅ User metadata complete:', { role, fullName })
    
    console.log('3. Verifying employee data access...')
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()

    if (employeeError || !employeeData) {
      console.error('❌ Employee data access failed:', employeeError)
      await supabase.auth.signOut()
      return false
    }
    
    console.log('✅ Employee data accessible:', {
      name: employeeData.full_name,
      active: employeeData.is_active
    })
    
    console.log('4. Testing session persistence...')
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('❌ Session not persisted')
      return false
    }
    
    console.log('✅ Session persisted correctly')
    
    console.log('5. Cleaning up...')
    await supabase.auth.signOut()
    
    console.log('\n🎉 Login fix verification completed successfully!')
    console.log('\n📋 Summary:')
    console.log('✅ Authentication working')
    console.log('✅ User metadata complete')
    console.log('✅ Employee data accessible')
    console.log('✅ Session management working')
    console.log('\n🌐 Application ready at: http://localhost:3002/login')
    console.log('📧 Email: mukhsin9@gmail.com')
    console.log('🔑 Password: admin123')
    
    return true
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

verifyLoginFixComplete().then(success => {
  process.exit(success ? 0 : 1)
})