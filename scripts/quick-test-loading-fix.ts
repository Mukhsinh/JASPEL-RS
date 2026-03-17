#!/usr/bin/env tsx

/**
 * Quick test untuk perbaikan loading loop
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function quickTest() {
  console.log('🔍 Quick test loading fix...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test session speed
    const startTime = Date.now()
    const { data: { session } } = await supabase.auth.getSession()
    const sessionTime = Date.now() - startTime
    
    console.log(`✅ Session: ${sessionTime}ms`)
    
    if (session) {
      // Test employee fetch
      const empStart = Date.now()
      const { data: employee } = await supabase
        .from('m_employees')
        .select('full_name, role')
        .eq('user_id', session.user.id)
        .single()
      
      const empTime = Date.now() - empStart
      console.log(`✅ Employee: ${empTime}ms`)
      
      if (employee) {
        console.log(`✅ User: ${employee.full_name} (${employee.role})`)
      }
    }
    
    console.log('✅ Test completed successfully!')
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

quickTest().catch(console.error)