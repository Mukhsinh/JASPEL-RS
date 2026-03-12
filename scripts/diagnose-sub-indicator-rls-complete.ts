#!/usr/bin/env tsx

/**
 * Diagnose Sub Indicator RLS Issue - Complete Analysis
 * 
 * Analisis mendalam masalah RLS dan buat solusi yang tepat
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function diagnoseRLSIssue() {
  console.log('🔍 DIAGNOSA LENGKAP MASALAH RLS SUB INDICATOR\n')

  try {
    // 1. Check RLS policies
    console.log('1️⃣ Memeriksa RLS Policies...')
    const { data: policies, error: policyError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'm_kpi_sub_indicators')

    if (policyError) {
      console.error('❌ Error fetching policies:', policyError)
      return
    }

    console.log(`✅ Ditemukan ${policies.length} RLS policies:`)
    policies.forEach(policy => {
      console.log(`   - ${policy.policyname} (${policy.cmd})`)
    })

    // 2. Check auth users and employees
    console.log('\n2️⃣ Memeriksa Users dan Employees...')
    const { data: authUsers } = await serviceClient.auth.admin.listUsers()
    const { data: employees } = await serviceClient
      .from('m_employees')
      .select('user_id, employee_code, full_name, role, is_active')

    console.log(`✅ Auth Users: ${authUsers.users.length}`)
    console.log(`✅ Employee Records: ${employees?.length || 0}`)

    // Check mapping
    const employeeUserIds = new Set(employees?.map(emp => emp.user_id) || [])
    const unmappedUsers = authUsers.users.filter(user => !employeeUserIds.has(user.id))
    
    if (unmappedUsers.length > 0) {
      console.log(`⚠️ Users tanpa employee record: ${unmappedUsers.length}`)
      unmappedUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`)
      })
    } else {
      console.log('✅ Semua users memiliki employee record')
    }

    // 3. Test RLS dengan different contexts
    console.log('\n3️⃣ Testing RLS dengan berbagai konteks...')

    // Test dengan service role (should work)
    console.log('\n   🧪 Test dengan Service Role:')
    const { data: serviceTest, error: serviceError } = await serviceClient
      .from('m_kpi_sub_indicators')
      .select('count')
      .single()

    if (serviceError) {
      console.log(`   ❌ Service role failed: ${serviceError.message}`)
    } else {
      console.log(`   ✅ Service role berhasil`)
    }

    // Test dengan anon key tanpa auth (should fail)
    console.log('\n   🧪 Test dengan Anon Key (tanpa auth):')
    const { data: anonTest, error: anonError } = await anonClient
      .from('m_kpi_sub_indicators')
      .select('count')
      .single()

    if (anonError) {
      console.log(`   ❌ Anon key failed (expected): ${anonError.message}`)
    } else {
      console.log(`   ⚠️ Anon key berhasil (unexpected)`)
    }

    // 4. Test dengan user authentication
    console.log('\n4️⃣ Testing dengan User Authentication...')
    
    if (employees && employees.length > 0) {
      const testEmployee = employees.find(emp => emp.role === 'superadmin' && emp.is_active)
      
      if (testEmployee) {
        const testUser = authUsers.users.find(user => user.id === testEmployee.user_id)
        
        if (testUser) {
          console.log(`\n   🧪 Test dengan Superadmin: ${testUser.email}`)
          
          // Create authenticated client
          const { data: authData, error: signInError } = await anonClient.auth.signInWithPassword({
            email: testUser.email!,
            password: 'defaultpassword123' // Assuming default password
          })

          if (signInError) {
            console.log(`   ⚠️ Login failed: ${signInError.message}`)
            
            // Try to reset password and test
            console.log('   🔄 Attempting password reset...')
            const { error: resetError } = await serviceClient.auth.admin.updateUserById(testUser.id, {
              password: 'testpassword123'
            })
            
            if (resetError) {
              console.log(`   ❌ Password reset failed: ${resetError.message}`)
            } else {
              console.log('   ✅ Password reset berhasil')
              
              // Try login again
              const { data: authData2, error: signInError2 } = await anonClient.auth.signInWithPassword({
                email: testUser.email!,
                password: 'testpassword123'
              })
              
              if (signInError2) {
                console.log(`   ❌ Login masih gagal: ${signInError2.message}`)
              } else {
                console.log('   ✅ Login berhasil setelah reset password')
                
                // Test RLS dengan authenticated user
                const { data: authTest, error: authTestError } = await anonClient
                  .from('m_kpi_sub_indicators')
                  .select('count')
                  .single()

                if (authTestError) {
                  console.log(`   ❌ RLS test failed: ${authTestError.message}`)
                } else {
                  console.log('   ✅ RLS test berhasil dengan authenticated user')
                }
              }
            }
          } else {
            console.log('   ✅ Login berhasil')
            
            // Test RLS dengan authenticated user
            const { data: authTest, error: authTestError } = await anonClient
              .from('m_kpi_sub_indicators')
              .select('count')
              .single()

            if (authTestError) {
              console.log(`   ❌ RLS test failed: ${authTestError.message}`)
            } else {
              console.log('   ✅ RLS test berhasil dengan authenticated user')
            }
          }
        }
      }
    }

    // 5. Check browser session simulation
    console.log('\n5️⃣ Simulasi Browser Session...')
    
    // Check if we can simulate browser behavior
    const browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: {
          getItem: (key: string) => null,
          setItem: (key: string, value: string) => {},
          removeItem: (key: string) => {}
        }
      }
    })

    console.log('   📝 Browser client created with session storage')

    // 6. Recommendations
    console.log('\n6️⃣ REKOMENDASI PERBAIKAN:')
    
    if (unmappedUsers.length > 0) {
      console.log('   🔧 Buat employee records untuk users yang belum ada')
    }
    
    console.log('   🔧 Pastikan browser client memiliki valid session')
    console.log('   🔧 Periksa middleware auth untuk refresh session')
    console.log('   🔧 Tambahkan error handling yang lebih baik di form')
    console.log('   🔧 Implementasi retry mechanism untuk RLS failures')

    console.log('\n🎯 LANGKAH SELANJUTNYA:')
    console.log('1. Perbaiki session management di browser')
    console.log('2. Tambahkan fallback untuk RLS failures')
    console.log('3. Implementasi proper error handling')
    console.log('4. Test end-to-end di browser')

  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
  }
}

diagnoseRLSIssue().catch(console.error)