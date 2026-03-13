import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function diagnose() {
  console.log('🔍 DIAGNOSA ERROR 500 KPI CONFIG PAGE\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 1. Test sign in
  console.log('1️⃣ Testing sign in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mukhsin9@gmail.com',
    password: 'admin123'
  })

  if (authError) {
    console.error('❌ Auth error:', authError)
    return
  }
  console.log('✅ Signed in as:', authData.user?.email)

  // 2. Test loading units (first thing the page does)
  console.log('\n2️⃣ Testing m_units query...')
  const { data: units, error: unitsError } = await supabase
    .from('m_units')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  if (unitsError) {
    console.error('❌ Units error:', unitsError)
  } else {
    console.log('✅ Units loaded:', units?.length || 0)
    if (units && units.length > 0) {
      console.log('   First unit:', units[0])
    }
  }

  // 3. Test loading categories for first unit
  if (units && units.length > 0) {
    const firstUnitId = units[0].id
    console.log('\n3️⃣ Testing m_kpi_categories query for unit:', firstUnitId)
    
    const { data: categories, error: categoriesError } = await supabase
      .from('m_kpi_categories')
      .select('*')
      .eq('unit_id', firstUnitId)
      .order('category')

    if (categoriesError) {
      console.error('❌ Categories error:', categoriesError)
    } else {
      console.log('✅ Categories loaded:', categories?.length || 0)
    }

    // 4. Test loading indicators
    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.id)
      console.log('\n4️⃣ Testing m_kpi_indicators query...')
      
      const { data: indicators, error: indicatorsError } = await supabase
        .from('m_kpi_indicators')
        .select('*')
        .in('category_id', categoryIds)
        .order('code')

      if (indicatorsError) {
        console.error('❌ Indicators error:', indicatorsError)
      } else {
        console.log('✅ Indicators loaded:', indicators?.length || 0)
      }

      // 5. Test loading sub indicators
      if (indicators && indicators.length > 0) {
        const indicatorIds = indicators.map(i => i.id)
        console.log('\n5️⃣ Testing m_kpi_sub_indicators query...')
        
        const { data: subIndicators, error: subIndicatorsError } = await supabase
          .from('m_kpi_sub_indicators')
          .select('*')
          .in('indicator_id', indicatorIds)
          .order('code')

        if (subIndicatorsError) {
          console.error('❌ Sub indicators error:', subIndicatorsError)
        } else {
          console.log('✅ Sub indicators loaded:', subIndicators?.length || 0)
        }
      }
    }
  }

  // 6. Check employee profile
  console.log('\n6️⃣ Checking employee profile...')
  const { data: employee, error: employeeError } = await supabase
    .from('m_employees')
    .select('role, full_name, employee_code, user_id')
    .eq('user_id', authData.user.id)
    .single()

  if (employeeError) {
    console.error('❌ Employee error:', employeeError)
  } else {
    console.log('✅ Employee found:', employee)
  }

  // 7. Test the API route
  console.log('\n7️⃣ Testing API route /api/kpi-config...')
  try {
    const response = await fetch('http://localhost:3002/api/kpi-config', {
      headers: {
        'Cookie': `sb-access-token=${authData.session?.access_token}; sb-refresh-token=${authData.session?.refresh_token}`
      }
    })
    
    const data = await response.json()
    console.log('   Status:', response.status)
    console.log('   Response:', data)
  } catch (error: any) {
    console.error('❌ API error:', error.message)
  }

  console.log('\n✅ Diagnosis complete')
}

diagnose().catch(console.error)
