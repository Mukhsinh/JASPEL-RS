import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixLoginIssue() {
  console.log('=== FIX LOGIN ISSUE ===\n')
  
  // Test dengan anon key (seperti di browser)
  console.log('1. Testing with anon key (browser behavior)...')
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
  
  const email = 'mukhsin9@gmail.com'
  const password = 'admin123'
  
  // Sign in
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password
  })
  
  if (authError) {
    console.error('   ❌ Sign in failed:', authError.message)
    return
  }
  
  console.log('   ✅ Sign in successful')
  console.log('   User ID:', authData.user?.id)
  
  // Try to fetch employee with different approaches
  console.log('\n2. Testing employee fetch methods...')
  
  // Method 1: With .single()
  console.log('\n   Method 1: Using .single()')
  const { data: emp1, error: err1 } = await supabaseAnon
    .from('m_employees')
    .select('id, full_name, unit_id, is_active')
    .eq('user_id', authData.user!.id)
    .single()
  
  if (err1) {
    console.error('   ❌ Failed:', err1.message, '(code:', err1.code, ')')
  } else {
    console.log('   ✅ Success:', emp1?.full_name)
  }
  
  // Method 2: Without .single()
  console.log('\n   Method 2: Without .single()')
  const { data: emp2, error: err2 } = await supabaseAnon
    .from('m_employees')
    .select('id, full_name, unit_id, is_active')
    .eq('user_id', authData.user!.id)
  
  if (err2) {
    console.error('   ❌ Failed:', err2.message)
  } else {
    console.log('   ✅ Success, count:', emp2?.length)
    if (emp2 && emp2.length > 0) {
      console.log('   First record:', emp2[0].full_name)
    }
  }
  
  // Method 3: With .limit(1).maybeSingle()
  console.log('\n   Method 3: Using .limit(1).maybeSingle()')
  const { data: emp3, error: err3 } = await supabaseAnon
    .from('m_employees')
    .select('id, full_name, unit_id, is_active')
    .eq('user_id', authData.user!.id)
    .limit(1)
    .maybeSingle()
  
  if (err3) {
    console.error('   ❌ Failed:', err3.message)
  } else {
    console.log('   ✅ Success:', emp3?.full_name || 'No data')
  }
  
  // Check with service role
  console.log('\n3. Testing with service role (bypass RLS)...')
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  const { data: emp4, error: err4 } = await supabaseAdmin
    .from('m_employees')
    .select('id, full_name, unit_id, is_active')
    .eq('user_id', authData.user!.id)
    .single()
  
  if (err4) {
    console.error('   ❌ Failed:', err4.message)
  } else {
    console.log('   ✅ Success:', emp4?.full_name)
  }
  
  console.log('\n=== RECOMMENDATION ===')
  if (!err2 && emp2 && emp2.length > 0) {
    console.log('✅ Solution: Use array approach instead of .single()')
    console.log('   Change from: .single()')
    console.log('   Change to: fetch array and take first element')
  } else if (!err3) {
    console.log('✅ Solution: Use .maybeSingle() instead of .single()')
  }
}

fixLoginIssue()
