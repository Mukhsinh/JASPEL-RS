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
    const period = searchParams.get('period')
    const status = searchParams.get('status')

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    let employees: AssessmentStatus[]
    
    // Apply role-based filtering
    if (currentEmployee.role === 'unit_manager') {
      employees = await getAssessmentStatus(currentEmployee.unit_id, period)
    } else {
      // Superadmin can see all employees - get all units
      const { data: units } = await supabase
        .from('m_units')
        .select('id')
        .eq('is_active', true)
      
      const allEmployees: AssessmentStatus[] = []
      for (const unit of units || []) {
        const unitEmployees = await getAssessmentStatus(unit.id, period)
        allEmployees.push(...unitEmployees)
      }
      employees = allEmployees
    }

    // Filter by status if provided
    if (status && ['Belum Dinilai', 'Sebagian', 'Selesai'].includes(status)) {
      employees = employees.filter((emp: AssessmentStatus) => emp.status === status)
    }

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Assessment employees GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees for assessment' }, 
      { status: 500 }
    )
  }
}