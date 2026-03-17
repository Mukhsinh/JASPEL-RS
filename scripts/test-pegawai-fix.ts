#!/usr/bin/env tsx

/**
 * Test script to verify pegawai page fixes
 */

import { createClient } from '@supabase/supabase-js'

async function testPegawaiFix() {
  console.log('🔍 Testing pegawai page fixes...')
  
  try {
    // Create direct supabase client for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test 1: Check if m_employees table has all required columns using SQL
    console.log('\n1. Checking m_employees table structure...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'm_employees' 
          ORDER BY ordinal_position
        `
      })
    
    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError.message)
      // Try alternative method
      console.log('Trying alternative method...')
      const { data: tableInfo, error: altError } = await supabase
        .from('m_employees')
        .select('*')
        .limit(1)
      
      if (altError) {
        console.error('❌ Alternative method failed:', altError.message)
      } else {
        console.log('✅ Table exists and is accessible')
        if (tableInfo && tableInfo.length > 0) {
          console.log('📋 Available columns:', Object.keys(tableInfo[0]).join(', '))
        }
      }
    } else {
      const requiredColumns = [
        'id', 'employee_code', 'full_name', 'unit_id', 'position', 
        'phone', 'nik', 'bank_name', 'bank_account_number', 
        'bank_account_name', 'employee_status', 'tax_type', 'pns_grade'
      ]
      
      const existingColumns = columns?.map((col: any) => col.column_name) || []
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
      
      if (missingColumns.length > 0) {
        console.log('⚠️  Missing columns:', missingColumns)
      } else {
        console.log('✅ All required columns exist')
      }
      
      console.log('📋 Existing columns:', existingColumns.join(', '))
    }
    
    // Test 2: Test data query (simulate what the page does)
    console.log('\n2. Testing data query...')
    const { data: pegawaiData, error: queryError } = await supabase
      .from('m_employees')
      .select('*, m_units(name)')
      .limit(5)
    
    if (queryError) {
      console.error('❌ Error querying pegawai data:', queryError.message)
      
      // Try simpler query
      console.log('Trying simpler query...')
      const { data: simpleData, error: simpleError } = await supabase
        .from('m_employees')
        .select('*')
        .limit(5)
      
      if (simpleError) {
        console.error('❌ Simple query failed:', simpleError.message)
      } else {
        console.log('✅ Simple query successful, found', simpleData?.length || 0, 'records')
      }
    } else {
      console.log('✅ Query successful, found', pegawaiData?.length || 0, 'records')
      if (pegawaiData && pegawaiData.length > 0) {
        console.log('📄 Sample record keys:', Object.keys(pegawaiData[0]))
      }
    }
    
    // Test 3: Check if units table exists and has data
    console.log('\n3. Checking units table...')
    const { data: unitsData, error: unitsError } = await supabase
      .from('m_units')
      .select('id, name')
      .limit(5)
    
    if (unitsError) {
      console.error('❌ Error querying units:', unitsError.message)
    } else {
      console.log('✅ Units query successful, found', unitsData?.length || 0, 'units')
    }
    
    // Test 4: Test server action simulation
    console.log('\n4. Testing server action simulation...')
    
    // Simulate the query that getPegawaiWithUnits would make
    const { data: actionData, error: actionError, count } = await supabase
      .from('m_employees')
      .select('*, m_units(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 49) // First page, 50 items
    
    if (actionError) {
      console.error('❌ Server action simulation failed:', actionError.message)
    } else {
      console.log('✅ Server action simulation successful')
      console.log('📊 Total count:', count)
      console.log('📄 Records returned:', actionData?.length || 0)
    }
    
    console.log('\n🎉 Pegawai fix test completed!')
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testPegawaiFix().catch(console.error)