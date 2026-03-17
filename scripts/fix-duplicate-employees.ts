/**
 * Fix duplicate employee records
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixDuplicateEmployees() {
  console.log('🔧 FIXING DUPLICATE EMPLOYEE RECORDS\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Step 1: Find all users with duplicate employee records
  console.log('1️⃣ Finding duplicate employee records...')
  const { data: allEmployees, error: fetchError } = await supabase
    .from('m_employees')
    .select('id, user_id, full_name, role, is_active, created_at')
    .order('user_id')
    .order('created_at')

  if (fetchError) {
    console.error('❌ Failed to fetch employees:', fetchError.message)
    return
  }

  // Group by user_id
  const userGroups = new Map<string, any[]>()
  allEmployees.forEach(emp => {
    if (!userGroups.has(emp.user_id)) {
      userGroups.set(emp.user_id, [])
    }
    userGroups.get(emp.user_id)!.push(emp)
  })

  // Find duplicates
  const duplicates = Array.from(userGroups.entries()).filter(([_, emps]) => emps.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ No duplicate employee records found')
    return
  }

  console.log(`⚠️  Found ${duplicates.length} users with duplicate employee records\n`)

  // Step 2: Fix each duplicate
  for (const [userId, employees] of duplicates) {
    console.log(`\nFixing user_id: ${userId}`)
    console.log(`  Found ${employees.length} employee records:`)
    
    employees.forEach((emp, idx) => {
      console.log(`  ${idx + 1}. ID: ${emp.id}`)
      console.log(`     Name: ${emp.full_name}`)
      console.log(`     Role: ${emp.role}`)
      console.log(`     Active: ${emp.is_active}`)
      console.log(`     Created: ${new Date(emp.created_at).toLocaleString()}`)
    })

    // Keep the most recent active record, or the most recent if none are active
    const activeRecords = employees.filter(e => e.is_active)
    const recordToKeep = activeRecords.length > 0 
      ? activeRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : employees.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    const recordsToDelete = employees.filter(e => e.id !== recordToKeep.id)

    console.log(`\n  ✅ Keeping: ${recordToKeep.full_name} (${recordToKeep.id})`)
    console.log(`  ❌ Deleting ${recordsToDelete.length} duplicate(s)`)

    // Delete duplicates
    for (const emp of recordsToDelete) {
      const { error: deleteError } = await supabase
        .from('m_employees')
        .delete()
        .eq('id', emp.id)

      if (deleteError) {
        console.error(`  ❌ Failed to delete ${emp.id}:`, deleteError.message)
      } else {
        console.log(`  ✅ Deleted ${emp.id}`)
      }
    }
  }

  // Step 3: Verify fix
  console.log('\n2️⃣ Verifying fix...')
  const { data: verifyEmployees } = await supabase
    .from('m_employees')
    .select('user_id')

  const verifyGroups = new Map<string, number>()
  verifyEmployees?.forEach(emp => {
    verifyGroups.set(emp.user_id, (verifyGroups.get(emp.user_id) || 0) + 1)
  })

  const stillDuplicate = Array.from(verifyGroups.entries()).filter(([_, count]) => count > 1)

  if (stillDuplicate.length === 0) {
    console.log('✅ All duplicates fixed!')
  } else {
    console.error(`❌ Still have ${stillDuplicate.length} users with duplicates`)
  }

  // Step 4: Test login user specifically
  console.log('\n3️⃣ Testing mukhsin9@gmail.com specifically...')
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const testUser = authUsers.users.find(u => u.email === 'mukhsin9@gmail.com')

  if (testUser) {
    const { data: empRecords, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', testUser.id)

    if (empError) {
      console.error('❌ Error fetching employee:', empError.message)
    } else {
      console.log(`Found ${empRecords.length} employee record(s)`)
      if (empRecords.length === 1) {
        console.log('✅ Single employee record confirmed')
        console.log('   Name:', empRecords[0].full_name)
        console.log('   Role:', empRecords[0].role)
        console.log('   Active:', empRecords[0].is_active)
      } else if (empRecords.length > 1) {
        console.error('❌ Still has multiple records!')
      } else {
        console.error('❌ No employee record found!')
      }
    }
  }

  console.log('\n✅ Fix complete!')
}

fixDuplicateEmployees()
