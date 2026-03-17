import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AssessmentStatus {
  employee_id: string
  full_name: string
  unit_id: string
  unit_name: string
  period: string
  total_indicators: number
  assessed_indicators: number
  status: string
  completion_percentage: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's employee record
    const { data: currentEmployee, error: employeeError } = await supabase
      .from('m_employees')
      .select('id, role, unit_id, full_name')
      .eq('user_id', user.id)
      .single()

    if (employeeError) {
      console.error('Employee lookup error:', employeeError)
      return NextResponse.json({ 
        error: 'Failed to get employee record', 
        details: employeeError.message 
      }, { status: 500 })
    }

    if (!currentEmployee) {
      console.error('No employee record found for user:', user.id)
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    console.log('Current employee:', currentEmployee.full_name, 'Role:', currentEmployee.role)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const status = searchParams.get('status')

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    console.log('Fetching employees for period:', period)

    // Query the view directly - RLS should handle access control
    let query = supabase
      .from('v_assessment_status')
      .select('*')
      .eq('period', period)
      .order('full_name')

    // Apply unit filtering for unit managers
    if (currentEmployee.role === 'unit_manager') {
      query = query.eq('unit_id', currentEmployee.unit_id)
      console.log('Filtering by unit for unit manager:', currentEmployee.unit_id)
    }

    const { data: employees, error: viewError } = await query

    if (viewError) {
      console.error('View query error:', viewError)
      return NextResponse.json({ 
        error: 'Failed to fetch employees', 
        details: viewError.message 
      }, { status: 500 })
    }

    console.log('Found employees:', employees?.length || 0)

    // Filter by status if provided
    let filteredEmployees = employees || []
    if (status && ['Belum Dinilai', 'Sebagian', 'Selesai'].includes(status)) {
      filteredEmployees = filteredEmployees.filter((emp: AssessmentStatus) => emp.status === status)
      console.log('Filtered by status:', status, 'Count:', filteredEmployees.length)
    }

    return NextResponse.json({ employees: filteredEmployees })
  } catch (error) {
    console.error('Assessment employees GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees for assessment' }, 
      { status: 500 }
    )
  }
}