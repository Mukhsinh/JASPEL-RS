/**
 * Fix browser login redirect issue
 * Diagnosis menunjukkan login berhasil tapi redirect tidak berfungsi
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testBrowserRedirect() {
  console.log('🔍 Testing browser redirect issue...\n')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test login
  console.log('1️⃣ Testing login...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mukhsin9@gmail.com',
    password: 'admin123',
  })

  if (authError || !authData.user) {
    console.error('❌ Login failed:', authError?.message)
    return
  }

  console.log('✅ Login successful')
  console.log('   User ID:', authData.user.id)
  console.log('   Role:', authData.user.user_metadata?.role)

  // Check what middleware needs
  console.log('\n2️⃣ Checking middleware requirements...')
  
  // Role in user_metadata
  const role = authData.user.user_metadata?.role
  if (!role) {
    console.error('❌ CRITICAL: Role missing in user_metadata')
    console.error('   Middleware will fail and redirect back to login')
    return
  }
  console.log('✅ Role found:', role)

  // Employee record
  const { data: employee, error: empError } = await supabase
    .from('m_employees')
    .select('is_active')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (empError || !employee) {
    console.error('❌ CRITICAL: Cannot fetch employee record')
    console.error('   Error:', empError?.message)
    console.error('   Middleware will fail and redirect back to login')
    return
  }

  if (!employee.is_active) {
    console.error('❌ CRITICAL: Employee is inactive')
    console.error('   Middleware will redirect to login with error=inactive')
    return
  }

  console.log('✅ Employee is active')

  console.log('\n3️⃣ All middleware checks passed!')
  console.log('   Login should work in browser')
  console.log('\n📝 Issue is likely in client-side redirect logic')
  
  await supabase.auth.signOut()
}

testBrowserRedirect()
