#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

async function checkEmployeeData() {
  console.log('🔍 Checking Employee Data...\n')

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get test user ID
    const testUserId = '12ccbe26-9ef0-422a-9dd2-405354167df0'
    
    console.log('1️⃣ Checking all employee records for user...')
    
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUserId)

    if (empError) {
      console.error('❌ Employee query error:', empError.message)
      return
    }

    console.log(`✅ Found ${employees?.length || 0} employee records`)
    
    if (employees && employees.length > 0) {
      employees.forEach((emp, index) => {
        console.log(`   Record ${index + 1}:`, {
          id: emp.id,
          employee_code: emp.employee_code,
          full_name: emp.full_name,
          user_id: emp.user_id,
          is_active: emp.is_active,
          unit_id: emp.unit_id
        })
      })

      if (employees.length > 1) {
        console.log('⚠️  Multiple employee records found - this causes .single() to fail')
        console.log('🔧 Fixing by keeping only the first active record...')
        
        // Keep only the first record, delete others
        const keepRecord = employees[0]
        const deleteRecords = employees.slice(1)
        
        for (const record of deleteRecords) {
          const { error: deleteError } = await supabase
            .from('m_employees')
            .delete()
            .eq('id', record.id)
          
          if (deleteError) {
            console.error(`❌ Failed to delete duplicate record ${record.id}:`, deleteError.message)
          } else {
            console.log(`✅ Deleted duplicate record ${record.id}`)
          }
        }
        
        // Ensure the kept record is active
        if (!keepRecord.is_active) {
          const { error: updateError } = await supabase
            .from('m_employees')
            .update({ is_active: true })
            .eq('id', keepRecord.id)
          
          if (updateError) {
            console.error('❌ Failed to activate employee:', updateError.message)
          } else {
            console.log('✅ Employee record activated')
          }
        }
        
        console.log('✅ Employee data cleaned up')
      }
    } else {
      console.log('❌ No employee records found')
      
      // Create employee record if missing
      console.log('🔧 Creating missing employee record...')
      
      const { data: unit } = await supabase
        .from('m_units')
        .select('id')
        .limit(1)
        .single()
      
      if (!unit) {
        console.error('❌ No units found to assign employee')
        return
      }
      
      const { error: createError } = await supabase
        .from('m_employees')
        .insert({
          user_id: testUserId,
          employee_code: 'EMP001',
          full_name: 'Mukhsin',
          unit_id: unit.id,
          tax_status: 'TK/0',
          is_active: true
        })
      
      if (createError) {
        console.error('❌ Failed to create employee record:', createError.message)
      } else {
        console.log('✅ Employee record created')
      }
    }

    console.log('\n2️⃣ Testing single employee query...')
    
    const { data: singleEmployee, error: singleError } = await supabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active')
      .eq('user_id', testUserId)
      .single()

    if (singleError) {
      console.error('❌ Single employee query failed:', singleError.message)
      return
    }

    console.log('✅ Single employee query successful:', {
      id: singleEmployee.id,
      name: singleEmployee.full_name,
      active: singleEmployee.is_active
    })

    console.log('\n✅ Employee data is now clean and ready for login!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkEmployeeData()