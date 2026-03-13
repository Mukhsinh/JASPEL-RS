import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function checkError() {
  console.log('🔍 CHECKING KPI CONFIG ERROR\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 1. Sign in
  console.log('1️⃣ Signing in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mukhsin9@gmail.com',
    password: 'admin123'
  })

  if (authError) {
    console.error('❌ Auth error:', authError)
    return
  }
  console.log('✅ Signed in')

  // 2. Check all required tables exist
  console.log('\n2️⃣ Checking tables...')
  
  const tables = ['m_units', 'm_kpi_categories', 'm_kpi_indicators', 'm_kpi_sub_indicators', 'm_employees']
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.error(`❌ Error accessing ${table}:`, error.message)
    } else {
      console.log(`✅ ${table} accessible`)
    }
  }

  // 3. Check if user has proper role
  console.log('\n3️⃣ Checking user role...')
  const { data: employee, error: employeeError } = await supabase
    .from('m_employees')
    .select('role, full_name, is_active')
    .eq('user_id', authData.user.id)
    .single()

  if (employeeError) {
    console.error('❌ Employee error:', employeeError)
  } else {
    console.log('✅ Employee:', employee)
    if (employee.role !== 'superadmin') {
      console.warn('⚠️  User is not superadmin!')
    }
  }

  // 4. Test the exact queries from the page
  console.log('\n4️⃣ Testing page queries...')
  
  // Load units
  const { data: units, error: unitsError } = await supabase
    .from('m_units')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  if (unitsError) {
    console.error('❌ Units query error:', unitsError)
  } else {
    console.log(`✅ Units loaded: ${units?.length || 0}`)
  }

  if (units && units.length > 0) {
    const firstUnit = units[0]
    console.log(`\n5️⃣ Testing queries for unit: ${firstUnit.code}`)
    
    // Load categories
    const { data: categories, error: catError } = await supabase
      .from('m_kpi_categories')
      .select('*')
      .eq('unit_id', firstUnit.id)
      .order('category')

    if (catError) {
      console.error('❌ Categories error:', catError)
    } else {
      console.log(`✅ Categories: ${categories?.length || 0}`)
    }

    if (categories && categories.length > 0) {
      const categoryIds = categories.map(c => c.id)
      
      // Load indicators
      const { data: indicators, error: indError } = await supabase
        .from('m_kpi_indicators')
        .select('*')
        .in('category_id', categoryIds)
        .order('code')

      if (indError) {
        console.error('❌ Indicators error:', indError)
      } else {
        console.log(`✅ Indicators: ${indicators?.length || 0}`)
      }

      if (indicators && indicators.length > 0) {
        const indicatorIds = indicators.map(i => i.id)
        
        // Load sub indicators
        const { data: subIndicators, error: subError } = await supabase
          .from('m_kpi_sub_indicators')
          .select('*')
          .in('indicator_id', indicatorIds)
          .order('code')

        if (subError) {
          console.error('❌ Sub indicators error:', subError)
        } else {
          console.log(`✅ Sub indicators: ${subIndicators?.length || 0}`)
        }
      }
    }
  }

  console.log('\n✅ All checks complete')
  console.log('\n📝 If all checks passed, the issue might be:')
  console.log('   1. Browser cache - try hard refresh (Ctrl+Shift+R)')
  console.log('   2. Dev server needs restart')
  console.log('   3. Client-side rendering issue')
}

checkError().catch(console.error)
