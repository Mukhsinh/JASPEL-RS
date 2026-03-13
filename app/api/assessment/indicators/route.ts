import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's employee record
    const { data: currentEmployee } = await supabase
      .from('m_employees')
      .select('id, role, unit_id')
      .eq('user_id', user.id)
      .single()

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const period = searchParams.get('period')

    if (!employeeId || !period) {
      return NextResponse.json(
        { error: 'employee_id and period are required' }, 
        { status: 400 }
      )
    }

    // Authorization check for unit managers
    if (currentEmployee.role === 'unit_manager') {
      const { data: targetEmployee } = await supabase
        .from('m_employees')
        .select('unit_id')
        .eq('id', employeeId)
        .single()

      if (!targetEmployee || targetEmployee.unit_id !== currentEmployee.unit_id) {
        return NextResponse.json(
          { error: 'You can only view indicators for employees in your unit' }, 
          { status: 403 }
        )
      }
    }

    // Get employee's unit
    const { data: employee, error: employeeError } = await supabase
      .from('m_employees')
      .select('unit_id')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get categories for the unit first
    const { data: categories, error: categoriesError } = await supabase
      .from('m_kpi_categories')
      .select('id, name, type')
      .eq('unit_id', employee.unit_id)
      .eq('is_active', true)

    if (categoriesError) {
      return NextResponse.json({ error: `Failed to fetch categories: ${categoriesError.message}` }, { status: 500 })
    }

    const categoryMap = new Map(categories?.map(c => [c.id, c]) || [])

    // Get indicators for the categories
    const { data: indicators, error: indicatorsError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name, target_value, weight_percentage, category_id')
      .eq('is_active', true)
      .in('category_id', categories?.map(c => c.id) || [])

    if (indicatorsError) {
      return NextResponse.json({ error: `Failed to fetch indicators: ${indicatorsError.message}` }, { status: 500 })
    }

    // Get existing assessments
    const { data: existingAssessments, error: assessmentsError } = await supabase
      .from('t_kpi_assessments')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('period', period)
      .order('created_at')

    if (assessmentsError) {
      return NextResponse.json({ error: `Failed to fetch assessments: ${assessmentsError.message}` }, { status: 500 })
    }

    const assessmentMap = new Map((existingAssessments || []).map(a => [a.indicator_id, a]))

    // Map indicators with current assessments
    const indicatorsWithAssessments = (indicators || []).map(indicator => {
      const category = categoryMap.get(indicator.category_id)
      return {
        id: indicator.id,
        name: indicator.name,
        target_value: indicator.target_value,
        weight_percentage: indicator.weight_percentage,
        category_id: indicator.category_id,
        category_name: category?.name || 'Unknown Category',
        category_type: category?.type || 'P1',
        current_assessment: assessmentMap.get(indicator.id)
      }
    })
    
    // Group indicators by category
    const groupedIndicators = indicatorsWithAssessments.reduce((acc: any, indicator: any) => {
      const category = indicator.category_type
      if (!acc[category]) {
        acc[category] = {
          category: category,
          category_name: indicator.category_name,
          indicators: []
        }
      }
      acc[category].indicators.push({
        id: indicator.id,
        name: indicator.name,
        target_value: indicator.target_value,
        weight_percentage: indicator.weight_percentage,
        current_assessment: indicator.current_assessment
      })
      return acc
    }, {})

    // Convert to array and sort by category
    const categorizedIndicators = Object.values(groupedIndicators).sort((a: any, b: any) => {
      const order = { 'P1': 1, 'P2': 2, 'P3': 3 }
      return order[a.category as keyof typeof order] - order[b.category as keyof typeof order]
    })

    return NextResponse.json({ 
      indicators: categorizedIndicators,
      total_indicators: indicatorsWithAssessments.length 
    })
  } catch (error: any) {
    console.error('Assessment indicators GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI indicators' }, 
      { status: 500 }
    )
  }
}