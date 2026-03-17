#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

async function setupMissingData() {
  console.log('🔧 Setting up missing data for login...\n')

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const testUserId = '12ccbe26-9ef0-422a-9dd2-405354167df0'

    console.log('1️⃣ Checking and creating unit if needed...')
    
    const { data: existingUnits, error: unitCheckError } = await supabase
      .from('m_units')
      .select('id, name')
      .limit(1)

    let unitId: string

    if (unitCheckError || !existingUnits || existingUnits.length === 0) {
      console.log('🔧 Creating default unit...')
      
      const { data: newUnit, error: createUnitError } = await supabase
        .from('m_units')
        .insert({
          name: 'Unit Administrasi',
          description: 'Unit administrasi default',
          is_active: true
        })
        .select('id')
        .single()

      if (createUnitError || !newUnit) {
        console.error('❌ Failed to create unit:', createUnitError?.message)
        return
      }

      unitId = newUnit.id
      console.log('✅ Unit created:', unitId)
    } else {
      unitId = existingUnits[0].id
      console.log('✅ Using existing unit:', unitId)
    }

    console.log('\n2️⃣ Checking and creating employee record...')
    
    const { data: existingEmployee, error: empCheckError } = await supabase
      .from('m_employees')
      .select('id')
      .eq('user_id', testUserId)
      .maybeSingle()

    if (empCheckError) {
      console.error('❌ Employee check error:', empCheckError.message)
      return
    }

    if (!existingEmployee) {
      console.log('🔧 Creating employee record...')
      
      const { data: newEmployee, error: createEmpError } = await supabase
        .from('m_employees')
        .insert({
          user_id: testUserId,
          employee_code: 'ADM001',
          full_name: 'Mukhsin',
          unit_id: unitId,
          tax_status: 'TK/0',
          is_active: true
        })
        .select('id')
        .single()

      if (createEmpError || !newEmployee) {
        console.error('❌ Failed to create employee:', createEmpError?.message)
        return
      }

      console.log('✅ Employee created:', newEmployee.id)
    } else {
      console.log('✅ Employee already exists:', existingEmployee.id)
      
      // Ensure employee is active
      const { error: updateError } = await supabase
        .from('m_employees')
        .update({ is_active: true, unit_id: unitId })
        .eq('id', existingEmployee.id)

      if (updateError) {
        console.error('❌ Failed to update employee:', updateError.message)
      } else {
        console.log('✅ Employee updated and activated')
      }
    }

    console.log('\n3️⃣ Testing login flow...')
    
    // Switch to anon key for testing login
    const anonSupabase = createClient(
      supabaseUrl, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: authData, error: authError } = await anonSupabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })

    if (authError) {
      console.error('❌ Login test failed:', authError.message)
      return
    }

    console.log('✅ Login test successful')

    // Test employee fetch
    const { data: employee, error: empError } = await anonSupabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', authData.user.id)
      .single()

    if (empError) {
      console.error('❌ Employee fetch failed:', empError.message)
      return
    }

    console.log('✅ Employee fetch successful:', {
      id: employee.id,
      name: employee.full_name,
      active: employee.is_active
    })

    // Clean up
    await anonSupabase.auth.signOut()

    console.log('\n🎉 Setup complete! Login should now work correctly.')
    console.log('   Try logging in at: http://localhost:3002/login')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupMissingData()