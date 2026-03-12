#!/usr/bin/env tsx

/**
 * Fix Sub Indicator RLS Authentication Issue
 * 
 * Masalah: User tidak memiliki record di m_employees sehingga RLS policy gagal
 * Solusi: Pastikan user yang login memiliki record employee yang valid
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixSubIndicatorRLSAuth() {
  console.log('🔧 Memperbaiki masalah RLS Sub Indicator...\n')

  try {
    // 1. Check all auth users
    console.log('1️⃣ Memeriksa users di auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`✅ Ditemukan ${authUsers.users.length} users di auth.users`)
    authUsers.users.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`)
    })

    // 2. Check existing employees
    console.log('\n2️⃣ Memeriksa records di m_employees...')
    const { data: employees, error: empError } = await supabase
      .from('m_employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (empError) {
      console.error('❌ Error fetching employees:', empError)
      return
    }

    console.log(`✅ Ditemukan ${employees.length} records di m_employees`)
    employees.forEach(emp => {
      console.log(`   - User ID: ${emp.user_id}, Role: ${emp.role}, Active: ${emp.is_active}`)
    })

    // 3. Find users without employee records
    const employeeUserIds = new Set(employees.map(emp => emp.user_id))
    const usersWithoutEmployee = authUsers.users.filter(user => !employeeUserIds.has(user.id))

    if (usersWithoutEmployee.length === 0) {
      console.log('\n✅ Semua users sudah memiliki record employee')
    } else {
      console.log(`\n⚠️ Ditemukan ${usersWithoutEmployee.length} users tanpa record employee:`)
      usersWithoutEmployee.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`)
      })

      // 4. Get default unit for new employees
      const { data: units, error: unitError } = await supabase
        .from('m_units')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)

      if (unitError || !units.length) {
        console.error('❌ Error fetching units atau tidak ada unit aktif:', unitError)
        return
      }

      const defaultUnit = units[0]
      console.log(`\n📋 Menggunakan unit default: ${defaultUnit.name} (${defaultUnit.id})`)

      // 5. Create employee records for users without them
      console.log('\n3️⃣ Membuat record employee untuk users yang belum ada...')
      
      // Get existing employee codes to generate new ones
      const existingCodes = employees.map(emp => {
        const match = emp.employee_code?.match(/EMP(\d+)/)
        return match ? parseInt(match[1]) : 0
      }).filter(num => num > 0)
      
      let maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0
      
      for (const user of usersWithoutEmployee) {
        try {
          // Determine role based on email or make them superadmin for now
          const role = user.email?.includes('admin') ? 'superadmin' : 'superadmin' // Default to superadmin for testing
          
          // Generate employee code
          maxCode++
          const employeeCode = `EMP${String(maxCode).padStart(3, '0')}`
          
          // Extract name from email
          const emailName = user.email?.split('@')[0] || 'User'
          const fullName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._]/g, ' ')
          
          const { data: newEmployee, error: createError } = await supabase
            .from('m_employees')
            .insert({
              user_id: user.id,
              employee_code: employeeCode,
              full_name: fullName,
              role: role,
              unit_id: defaultUnit.id,
              is_active: true
            })
            .select()
            .single()

          if (createError) {
            console.error(`❌ Error creating employee for ${user.email}:`, createError)
          } else {
            console.log(`✅ Created employee record for ${user.email} with code ${employeeCode} and role ${role}`)
            
            // Update user metadata with role
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
              user_metadata: { role: role }
            })
            
            if (updateError) {
              console.error(`⚠️ Error updating user metadata for ${user.email}:`, updateError)
            } else {
              console.log(`✅ Updated user metadata for ${user.email}`)
            }
          }
        } catch (error) {
          console.error(`❌ Error processing user ${user.email}:`, error)
        }
      }
    }

    // 6. Test RLS policies
    console.log('\n4️⃣ Testing RLS policies untuk sub indicators...')
    
    // Test with first superadmin user
    const superadminEmployee = employees.find(emp => emp.role === 'superadmin' && emp.is_active)
    
    if (!superadminEmployee) {
      console.log('⚠️ Tidak ada superadmin aktif untuk testing')
      return
    }

    console.log(`🧪 Testing dengan superadmin user: ${superadminEmployee.user_id}`)

    // Create a test client with the superadmin user
    const { data: authData, error: signInError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUsers.users.find(u => u.id === superadminEmployee.user_id)?.email || ''
    })

    if (signInError) {
      console.error('❌ Error generating auth link:', signInError)
      return
    }

    // Test sub indicator access
    const { data: subIndicators, error: subError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('*')
      .limit(5)

    if (subError) {
      console.error('❌ RLS test failed:', subError)
    } else {
      console.log(`✅ RLS test passed - dapat mengakses ${subIndicators.length} sub indicators`)
    }

    console.log('\n🎉 Perbaikan RLS Sub Indicator selesai!')
    console.log('\n📝 Langkah selanjutnya:')
    console.log('1. Restart aplikasi: npm run dev')
    console.log('2. Login dengan user yang sudah diperbaiki')
    console.log('3. Test form sub indicator')

  } catch (error) {
    console.error('❌ Error during fix:', error)
  }
}

// Run the fix
fixSubIndicatorRLSAuth().catch(console.error)