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

async function getAssessmentStatus(unitId: string, period: string): Promise<AssessmentStatus[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_assessment_status')
    .select('*')
    .eq('unit_id', unitId)
    .eq('period', period)
    .order('full_name')

  if (error) {
    throw new Error(`Failed to fetch assessment status: ${error.message}`)
  }
  return data || []
}

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

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    if (employeeId) {
      // Get status for specific employee
      // Authorization check for unit managers
      if (currentEmployee.role === 'unit_manager') {
        const { data: targetEmployee } = await supabase
          .from('m_employees')
          .select('unit_id')
          .eq('id', employeeId)
          .single()

        if (!targetEmployee || targetEmployee.unit_id !== currentEmployee.unit_id) {
          return NextResponse.json(
            { error: 'You can only view status for employees in your unit' }, 
            { status: 403 }
          )
        }
      }

      // Get status for specific employee
      const statuses = await getAssessmentStatus(currentEmployee.unit_id, period)
      const employeeStatus = statuses.find((s: AssessmentStatus) => s.employee_id === employeeId)

      if (!employeeStatus) {
        return NextResponse.json({ error: 'Employee status not found' }, { status: 404 })
      }

      return NextResponse.json({ status: employeeStatus })
    } else {
      // Get status for all employees (filtered by role)
      let statuses: AssessmentStatus[]
      
      if (currentEmployee.role === 'unit_manager') {
        statuses = await getAssessmentStatus(currentEmployee.unit_id, period)
      } else {
        // Superadmin can see all employees - get all units
        const { data: units } = await supabase
          .from('m_units')
          .select('id')
          .eq('is_active', true)
        
        const allStatuses: AssessmentStatus[] = []
        for (const unit of units || []) {
          const unitStatuses = await getAssessmentStatus(unit.id, period)
          allStatuses.push(...unitStatuses)
        }
        statuses = allStatuses
      }
      
      // Calculate summary statistics
      const summary = {
        total_employees: statuses.length,
        completed: statuses.filter((s: AssessmentStatus) => s.status === 'Selesai').length,
        partial: statuses.filter((s: AssessmentStatus) => s.status === 'Sebagian').length,
        not_started: statuses.filter((s: AssessmentStatus) => s.status === 'Belum Dinilai').length,
        completion_rate: statuses.length > 0 
          ? Math.round((statuses.filter((s: AssessmentStatus) => s.status === 'Selesai').length / statuses.length) * 100)
          : 0
      }

      return NextResponse.json({ 
        statuses,
        summary 
      })
    }
  } catch (error: any) {
    console.error('Assessment status GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment status' }, 
      { status: 500 }
    )
  }
}