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

    // Get employees
    let employeeQuery = supabase
      .from('m_employees')
      .select(`
        id,
        full_name,
        unit_id,
        m_units (name)
      `)
      .eq('is_active', true)
      .order('full_name')

    if (currentEmployee.role === 'unit_manager') {
      employeeQuery = employeeQuery.eq('unit_id', currentEmployee.unit_id)
    }

    const { data: employeesData, error: employeesError } = await employeeQuery

    if (employeesError) {
      return NextResponse.json({ error: employeesError.message }, { status: 500 })
    }

    // Get KPI indicators count per unit to determine total_indicators
    const { data: indicatorsData, error: indicatorsError } = await supabase
      .from('m_kpi_indicators')
      .select(`
        id,
        category_id,
        m_kpi_categories (unit_id)
      `)
      .eq('is_active', true)

    if (indicatorsError) {
      return NextResponse.json({ error: indicatorsError.message }, { status: 500 })
    }

    // Group indicators by unit_id
    const indicatorsCountByUnit = (indicatorsData || []).reduce((acc: any, curr: any) => {
      const unitId = curr.m_kpi_categories?.unit_id
      if (unitId) {
        acc[unitId] = (acc[unitId] || 0) + 1
      }
      return acc
    }, {})

    // Get assessments for current period
    const { data: assessmentsData, error: assessmentsError } = await supabase
      .from('t_kpi_assessments')
      .select('employee_id, indicator_id')
      .eq('period', period)

    if (assessmentsError) {
      return NextResponse.json({ error: assessmentsError.message }, { status: 500 })
    }

    // Group assessments by employee_id
    const assessmentsCountByEmployee = (assessmentsData || []).reduce((acc: any, curr: any) => {
      acc[curr.employee_id] = (acc[curr.employee_id] || 0) + 1
      return acc
    }, {})

    // Map to AssessmentStatus format
    const employees: AssessmentStatus[] = (employeesData || []).map(emp => {
      const total_indicators = indicatorsCountByUnit[emp.unit_id] || 0
      const assessed_indicators = assessmentsCountByEmployee[emp.id] || 0

      let status = 'Belum Dinilai'
      if (assessed_indicators > 0) {
        status = assessed_indicators >= total_indicators ? 'Selesai' : 'Sebagian'
      }

      return {
        employee_id: emp.id,
        full_name: emp.full_name,
        unit_id: emp.unit_id,
        unit_name: (emp.m_units as any)?.name || 'Unknown',
        period: period,
        total_indicators,
        assessed_indicators,
        status,
        completion_percentage: total_indicators > 0 ? (assessed_indicators / total_indicators) * 100 : 0
      }
    })

    // Filter by status if provided
    let filteredEmployees = employees
    if (status && ['Belum Dinilai', 'Sebagian', 'Selesai'].includes(status)) {
      filteredEmployees = employees.filter(emp => emp.status === status)
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