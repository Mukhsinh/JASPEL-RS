import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
interface Assessment {
  id?: string
  employee_id: string
  indicator_id: string
  period: string
  realization_value: number
  target_value: number
  weight_percentage: number
  achievement_percentage?: number
  score?: number
  notes?: string
  sub_assessments?: any
  assessor_id: string
  created_at?: string
  updated_at?: string
}

// Simple audit logging function to avoid circular dependencies
async function logAssessmentAudit(
  operation: 'CREATE' | 'UPDATE',
  recordId: string,
  details: string,
  supabase: any
) {
  try {
    await supabase
      .from('t_audit_log')
      .insert({
        table_name: 't_kpi_assessments',
        operation,
        record_id: recordId,
        details,
        created_at: new Date().toISOString()
      })
  } catch (error: any) {
    console.error('Audit logging failed:', error)
    // Don't throw error to avoid breaking the main operation
  }
}
async function getAssessmentsForEmployee(employeeId: string, period: string): Promise<Assessment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('t_kpi_assessments')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('period', period)
    .order('created_at')

  if (error) {
    throw new Error(`Failed to fetch assessments: ${error.message}`)
  }
  return data || []
}

async function upsertAssessment(assessment: Assessment): Promise<Assessment> {
  const supabase = await createClient()

  // Achievement logic can stay the same for backward compatibility
  // Or it could be overriden by the frontend precalculated score if provided
  const achievement = assessment.achievement_percentage !== undefined
    ? assessment.achievement_percentage
    : (assessment.target_value === 0 ? 100 : (assessment.realization_value / assessment.target_value) * 100)

  const score = assessment.score !== undefined
    ? assessment.score
    : (achievement * assessment.weight_percentage) / 100

  const assessmentData = {
    employee_id: assessment.employee_id,
    indicator_id: assessment.indicator_id,
    period: assessment.period,
    realization_value: assessment.realization_value,
    target_value: assessment.target_value,
    weight_percentage: assessment.weight_percentage,
    achievement_percentage: achievement,
    score: score,
    notes: assessment.notes,
    sub_assessments: assessment.sub_assessments || [],
    assessor_id: assessment.assessor_id
  }

  const { data: existing } = await supabase
    .from('t_kpi_assessments')
    .select('id')
    .eq('employee_id', assessment.employee_id)
    .eq('indicator_id', assessment.indicator_id)
    .eq('period', assessment.period)
    .single()

  let result
  let operation: 'CREATE' | 'UPDATE' = 'CREATE'

  if (existing) {
    operation = 'UPDATE'
    const { data, error } = await supabase
      .from('t_kpi_assessments')
      .update(assessmentData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update assessment: ${error.message}`)
    }
    result = data
  } else {
    const { data, error } = await supabase
      .from('t_kpi_assessments')
      .insert(assessmentData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create assessment: ${error.message}`)
    }
    result = data
  }

  await logAssessmentAudit(
    operation,
    result.id,
    `${operation === 'CREATE' ? 'Created' : 'Updated'} assessment for employee ${assessment.employee_id}`,
    supabase
  )

  return result
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const assessments = await getAssessmentsForEmployee(employeeId, period)

    return NextResponse.json({ assessments })
  } catch (error: any) {
    console.error('Assessment GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's employee record
    const { data: currentEmployee, error: empError } = await supabase
      .from('m_employees')
      .select('id, role, unit_id')
      .or(`email.eq.${user.email},user_id.eq.${user.id}`)
      .single()

    if (empError || !currentEmployee) {
      console.error('Employee mapping error:', empError, 'for user:', user.email, user.id);
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    const body = await request.json()
    const assessment: Assessment = {
      ...body,
      assessor_id: currentEmployee.id
    }

    // Authorization check - ensure user can assess this employee
    if (currentEmployee.role === 'unit_manager') {
      const { data: targetEmployee } = await supabase
        .from('m_employees')
        .select('unit_id')
        .eq('id', assessment.employee_id)
        .single()

      if (!targetEmployee || targetEmployee.unit_id !== currentEmployee.unit_id) {
        return NextResponse.json(
          { error: 'You can only assess employees in your unit' },
          { status: 403 }
        )
      }
    }

    const savedAssessment = await upsertAssessment(assessment)

    return NextResponse.json({ assessment: savedAssessment })
  } catch (error: any) {
    console.error('Assessment POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save assessment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's employee record
    const { data: currentEmployee, error: empError } = await supabase
      .from('m_employees')
      .select('id, role, unit_id')
      .or(`email.eq.${user.email},user_id.eq.${user.id}`)
      .single()

    if (empError || !currentEmployee) {
      console.error('Employee mapping error:', empError, 'for user:', user.email, user.id);
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    const body = await request.json()
    const assessment: Assessment = {
      ...body,
      assessor_id: currentEmployee.id
    }

    // Authorization check
    if (currentEmployee.role === 'unit_manager') {
      const { data: targetEmployee } = await supabase
        .from('m_employees')
        .select('unit_id')
        .eq('id', assessment.employee_id)
        .single()

      if (!targetEmployee || targetEmployee.unit_id !== currentEmployee.unit_id) {
        return NextResponse.json(
          { error: 'You can only assess employees in your unit' },
          { status: 403 }
        )
      }
    }

    const updatedAssessment = await upsertAssessment(assessment)

    return NextResponse.json({ assessment: updatedAssessment })
  } catch (error: any) {
    console.error('Assessment PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update assessment' },
      { status: 500 }
    )
  }
}