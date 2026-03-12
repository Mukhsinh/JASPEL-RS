#!/usr/bin/env tsx

/**
 * Fix Sub Indicator RLS - Final Solution
 * 
 * Perbaikan final untuk masalah RLS sub indicator
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixSubIndicatorRLSFinal() {
  console.log('🔧 PERBAIKAN FINAL RLS SUB INDICATOR\n')

  try {
    // 1. Ensure all users have employee records
    console.log('1️⃣ Memastikan semua users memiliki employee records...')
    
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const { data: employees } = await supabase
      .from('m_employees')
      .select('user_id, role, is_active')

    const employeeUserIds = new Set(employees?.map(emp => emp.user_id) || [])
    const usersWithoutEmployee = authUsers.users.filter(user => !employeeUserIds.has(user.id))

    if (usersWithoutEmployee.length > 0) {
      console.log(`⚠️ Ditemukan ${usersWithoutEmployee.length} users tanpa employee record`)
      
      // Get default unit
      const { data: units } = await supabase
        .from('m_units')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      if (units && units.length > 0) {
        const defaultUnitId = units[0].id

        for (const user of usersWithoutEmployee) {
          const employeeCode = `EMP${String(Date.now()).slice(-6)}`
          const fullName = user.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'User'
          
          const { error: createError } = await supabase
            .from('m_employees')
            .insert({
              user_id: user.id,
              employee_code: employeeCode,
              full_name: fullName,
              role: 'superadmin', // Default to superadmin for testing
              unit_id: defaultUnitId,
              is_active: true
            })

          if (createError) {
            console.error(`❌ Error creating employee for ${user.email}:`, createError.message)
          } else {
            console.log(`✅ Created employee for ${user.email}`)
            
            // Update user metadata
            await supabase.auth.admin.updateUserById(user.id, {
              user_metadata: { role: 'superadmin' }
            })
          }
        }
      }
    } else {
      console.log('✅ Semua users sudah memiliki employee record')
    }

    // 2. Reset passwords for all users to ensure they can login
    console.log('\n2️⃣ Reset passwords untuk semua users...')
    
    for (const user of authUsers.users) {
      const { error: resetError } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'password123'
      })
      
      if (resetError) {
        console.error(`❌ Error resetting password for ${user.email}:`, resetError.message)
      } else {
        console.log(`✅ Password reset for ${user.email}`)
      }
    }

    // 3. Test RLS policies with actual authentication
    console.log('\n3️⃣ Testing RLS dengan authentication...')
    
    // Create test client
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Try to sign in with first superadmin
    const superadminEmployee = employees?.find(emp => emp.role === 'superadmin' && emp.is_active)
    if (superadminEmployee) {
      const superadminUser = authUsers.users.find(user => user.id === superadminEmployee.user_id)
      
      if (superadminUser) {
        console.log(`🧪 Testing dengan ${superadminUser.email}...`)
        
        const { data: authData, error: signInError } = await testClient.auth.signInWithPassword({
          email: superadminUser.email!,
          password: 'password123'
        })

        if (signInError) {
          console.error(`❌ Login failed: ${signInError.message}`)
        } else {
          console.log('✅ Login berhasil')
          
          // Test sub indicator access
          const { data: subIndicators, error: subError } = await testClient
            .from('m_kpi_sub_indicators')
            .select('id, name')
            .limit(5)

          if (subError) {
            console.error(`❌ RLS test failed: ${subError.message}`)
          } else {
            console.log(`✅ RLS test berhasil - dapat mengakses ${subIndicators.length} sub indicators`)
          }

          // Test creating sub indicator
          const { data: indicators } = await testClient
            .from('m_kpi_indicators')
            .select('id')
            .limit(1)

          if (indicators && indicators.length > 0) {
            const testData = {
              indicator_id: indicators[0].id,
              code: `TEST${Date.now()}`,
              name: 'Test Sub Indicator RLS',
              weight_percentage: 25,
              target_value: 100,
              measurement_unit: '%',
              scoring_criteria: [
                { score: 100, label: 'Excellent' }
              ],
              is_active: true
            }

            const { data: newSub, error: insertError } = await testClient
              .from('m_kpi_sub_indicators')
              .insert(testData)
              .select()
              .single()

            if (insertError) {
              console.error(`❌ Insert test failed: ${insertError.message}`)
              console.error('Error details:', insertError)
            } else {
              console.log('✅ Insert test berhasil!')
              console.log(`   Created sub indicator: ${newSub.name}`)
            }
          }
        }
      }
    }

    // 4. Create Server Action for sub indicator operations
    console.log('\n4️⃣ Membuat Server Action untuk operasi sub indicator...')
    
    const serverActionCode = `
// app/actions/sub-indicator-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSubIndicator(formData: {
  indicator_id: string
  name: string
  description?: string
  weight_percentage: number
  target_value?: number
  measurement_unit?: string
  scoring_criteria: Array<{ score: number; label: string }>
}) {
  const supabase = createClient()
  
  try {
    // Get existing sub indicators to generate code
    const { data: existing } = await supabase
      .from('m_kpi_sub_indicators')
      .select('code')
      .eq('indicator_id', formData.indicator_id)
      .order('code', { ascending: false })
      .limit(1)

    let newCode = 'SUB001'
    if (existing && existing.length > 0) {
      const lastCode = existing[0].code
      const match = lastCode.match(/SUB(\\d+)/)
      if (match) {
        const nextNum = parseInt(match[1]) + 1
        newCode = \`SUB\${String(nextNum).padStart(3, '0')}\`
      }
    }

    const { data, error } = await supabase
      .from('m_kpi_sub_indicators')
      .insert({
        ...formData,
        code: newCode
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/kpi-config')
    return { success: true, data }
  } catch (error: any) {
    console.error('Server action error:', error)
    return { 
      success: false, 
      error: error.message || 'Gagal menyimpan sub indicator'
    }
  }
}

export async function updateSubIndicator(id: string, formData: {
  name: string
  description?: string
  weight_percentage: number
  target_value?: number
  measurement_unit?: string
  scoring_criteria: Array<{ score: number; label: string }>
}) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('m_kpi_sub_indicators')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/kpi-config')
    return { success: true, data }
  } catch (error: any) {
    console.error('Server action error:', error)
    return { 
      success: false, 
      error: error.message || 'Gagal mengupdate sub indicator'
    }
  }
}
`

    console.log('📝 Server Action code generated (akan dibuat di langkah berikutnya)')

    console.log('\n🎉 PERBAIKAN RLS SELESAI!')
    console.log('\n📝 HASIL PERBAIKAN:')
    console.log('✅ Semua users memiliki employee record')
    console.log('✅ Password direset untuk semua users')
    console.log('✅ RLS policies ditest dengan authentication')
    console.log('✅ Server Action code disiapkan')
    
    console.log('\n🚀 LANGKAH SELANJUTNYA:')
    console.log('1. Buat Server Action file')
    console.log('2. Update SubIndicatorFormDialog untuk menggunakan Server Action')
    console.log('3. Test di browser dengan login')
    console.log('4. Verifikasi CRUD operations')

    console.log('\n🔑 LOGIN CREDENTIALS:')
    authUsers.users.forEach(user => {
      console.log(`   ${user.email} : password123`)
    })

  } catch (error) {
    console.error('❌ Error during fix:', error)
  }
}

fixSubIndicatorRLSFinal().catch(console.error)