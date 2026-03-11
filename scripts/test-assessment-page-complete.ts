import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testAssessmentPageComplete() {
  console.log('🧪 Testing Assessment Page Complete Flow...\n')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test 1: Simulate user authentication and employee lookup
    console.log('1. Testing employee lookup by user_id...')
    
    // Get a test user
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser = users.users.find(u => u.email?.includes('superadmin'))
    
    if (testUser) {
      console.log('✅ Test user found:', testUser.email)
      
      // Test employee lookup by user_id (like the page does)
      const { data: employee, error: empError } = await supabase
        .from('m_employees')
        .select('id, role, unit_id, full_name')
        .eq('user_id', testUser.id)
        .single()
      
      if (empError) {
        console.log('❌ Employee lookup error:', empError.message)
      } else {
        console.log('✅ Employee found:', employee.full_name, '- Role:', employee.role)
        
        // Test 2: Test API endpoints with this user context
        console.log('\n2. Testing API endpoints simulation...')
        
        // Test periods
        const { data: periods } = await supabase
          .from('t_pool')
          .select('period')
          .in('status', ['approved', 'distributed'])
          .order('period', { ascending: false })
          .limit(1)
        
        if (periods && periods.length > 0) {
          const currentPeriod = periods[0].period
          console.log('✅ Available period:', currentPeriod)
          
          // Test assessment status endpoint simulation
          const { data: statusData, error: statusError } = await supabase
            .from('v_assessment_status')
            .select('*')
            .eq('period', currentPeriod)
            .limit(5)
          
          if (statusError) {
            console.log('❌ Status endpoint error:', statusError.message)
          } else {
            console.log('✅ Status data:', statusData?.length || 0, 'records')
            if (statusData && statusData.length > 0) {
              console.log('   Sample:', statusData[0].full_name, '-', statusData[0].status)
            }
          }
          
          // Test employees endpoint simulation
          if (employee.role === 'unit_manager') {
            const { data: unitEmployees, error: empError } = await supabase
              .from('v_assessment_status')
              .select('*')
              .eq('unit_id', employee.unit_id)
              .eq('period', currentPeriod)
            
            if (empError) {
              console.log('❌ Unit employees error:', empError.message)
            } else {
              console.log('✅ Unit employees:', unitEmployees?.length || 0, 'records')
            }
          }
          
          // Test indicators endpoint simulation
          if (statusData && statusData.length > 0) {
            const testEmployeeId = statusData[0].employee_id
            
            // Get employee's unit
            const { data: empUnit } = await supabase
              .from('m_employees')
              .select('unit_id')
              .eq('id', testEmployeeId)
              .single()
            
            if (empUnit) {
              // Get categories for the unit
              const { data: categories } = await supabase
                .from('m_kpi_categories')
                .select('id, name, type')
                .eq('unit_id', empUnit.unit_id)
                .eq('is_active', true)
              
              if (categories && categories.length > 0) {
                console.log('✅ Categories found:', categories.length)
                
                // Get indicators
                const { data: indicators, error: indError } = await supabase
                  .from('m_kpi_indicators')
                  .select('id, name, target_value, weight_percentage, category_id')
                  .eq('is_active', true)
                  .in('category_id', categories.map(c => c.id))
                
                if (indError) {
                  console.log('❌ Indicators error:', indError.message)
                } else {
                  console.log('✅ Indicators found:', indicators?.length || 0)
                }
              }
            }
          }
        }
      }
    } else {
      console.log('❌ No test user found')
    }
    
    // Test 3: Test RLS policies are working
    console.log('\n3. Testing RLS policies...')
    
    // Create a regular client (non-service role) to test RLS
    const regularClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Test without auth (should fail)
    const { data: noAuthData, error: noAuthError } = await regularClient
      .from('m_kpi_sub_indicators')
      .select('*')
      .limit(1)
    
    if (noAuthError) {
      console.log('✅ RLS working - no auth access denied:', noAuthError.message)
    } else {
      console.log('⚠️  RLS might not be working - got data without auth')
    }
    
    console.log('\n✅ Assessment page complete test finished!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAssessmentPageComplete()