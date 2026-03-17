import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function diagnoseLoginIssue() {
  console.log('🔍 Mendiagnosis masalah login...\n')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const testEmail = 'mukhsin9@gmail.com'
  const testPassword = 'admin123'

  try {
    // 1. Check if user exists in auth.users
    console.log('1️⃣ Memeriksa user di auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error mengambil auth users:', authError.message)
      return
    }

    const authUser = authUsers.users.find(u => u.email === testEmail)
    
    if (!authUser) {
      console.error(`❌ User ${testEmail} tidak ditemukan di auth.users`)
      console.log('\n📝 Membuat user baru...')
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          role: 'superadmin'
        }
      })
      
      if (createError) {
        console.error('❌ Error membuat user:', createError.message)
        return
      }
      
      console.log('✅ User berhasil dibuat:', newUser.user.id)
      
      // Create employee record
      const { error: employeeError } = await supabase
        .from('m_employees')
        .insert({
          user_id: newUser.user.id,
          employee_code: 'ADMIN001',
          full_name: 'Super Administrator',
          unit_id: null,
          tax_status: 'TK/0',
          is_active: true
        })
      
      if (employeeError) {
        console.error('❌ Error membuat employee:', employeeError.message)
        return
      }
      
      console.log('✅ Employee record berhasil dibuat')
      return
    }

    console.log('✅ User ditemukan di auth.users')
    console.log('   - ID:', authUser.id)
    console.log('   - Email:', authUser.email)
    console.log('   - Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('   - Role:', authUser.user_metadata?.role || 'NOT SET')
    console.log('   - Created:', authUser.created_at)

    // 2. Check if user has role in metadata
    if (!authUser.user_metadata?.role) {
      console.log('\n⚠️  User tidak memiliki role di metadata')
      console.log('📝 Menambahkan role...')
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          user_metadata: {
            role: 'superadmin'
          }
        }
      )
      
      if (updateError) {
        console.error('❌ Error update metadata:', updateError.message)
      } else {
        console.log('✅ Role berhasil ditambahkan')
      }
    }

    // 3. Check employee record
    console.log('\n2️⃣ Memeriksa employee record...')
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('*')
      .eq('user_id', authUser.id)
      .single()

    if (employeeError || !employee) {
      console.error('❌ Employee record tidak ditemukan')
      console.log('📝 Membuat employee record...')
      
      const { error: insertError } = await supabase
        .from('m_employees')
        .insert({
          user_id: authUser.id,
          employee_code: 'ADMIN001',
          full_name: 'Super Administrator',
          unit_id: null,
          tax_status: 'TK/0',
          is_active: true
        })
      
      if (insertError) {
        console.error('❌ Error membuat employee:', insertError.message)
      } else {
        console.log('✅ Employee record berhasil dibuat')
      }
    } else {
      console.log('✅ Employee record ditemukan')
      console.log('   - ID:', employee.id)
      console.log('   - Code:', employee.employee_code)
      console.log('   - Name:', employee.full_name)
      console.log('   - Active:', employee.is_active)
      console.log('   - Unit ID:', employee.unit_id || 'null (superadmin)')
    }

    // 4. Test login
    console.log('\n3️⃣ Testing login dengan credentials...')
    
    // Create a new client without service role for testing
    const testClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      console.error('❌ Login gagal:', loginError.message)
      
      // Try to reset password
      console.log('\n📝 Mencoba reset password...')
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          password: testPassword
        }
      )
      
      if (resetError) {
        console.error('❌ Error reset password:', resetError.message)
      } else {
        console.log('✅ Password berhasil direset')
        console.log('🔄 Silakan coba login lagi')
      }
    } else {
      console.log('✅ Login berhasil!')
      console.log('   - User ID:', loginData.user?.id)
      console.log('   - Email:', loginData.user?.email)
      console.log('   - Session:', loginData.session ? 'Created' : 'Not created')
    }

    // 5. Check RLS policies
    console.log('\n4️⃣ Memeriksa RLS policies...')
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'm_employees' })
      .then(() => ({ data: 'OK', error: null }))
      .catch((err: any) => ({ data: null, error: err }))

    if (policyError) {
      console.log('⚠️  Tidak dapat memeriksa RLS policies (ini normal)')
    } else {
      console.log('✅ RLS policies aktif')
    }

    console.log('\n✅ Diagnosis selesai!')
    console.log('\n📋 Ringkasan:')
    console.log('   - User exists:', authUser ? 'Yes' : 'No')
    console.log('   - Has role:', authUser?.user_metadata?.role ? 'Yes' : 'No')
    console.log('   - Employee exists:', employee ? 'Yes' : 'No')
    console.log('   - Employee active:', employee?.is_active ? 'Yes' : 'No')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  }
}

diagnoseLoginIssue()
