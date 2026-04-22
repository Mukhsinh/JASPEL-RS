import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate reports based on type and period
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.7, 12.8
 */
export async function POST(request: NextRequest) {
  try {
    const { reportType, period } = await request.json()

    if (!reportType || !period) {
      return NextResponse.json(
        { error: 'Report type and period are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    let data: any[] = []

    switch (reportType) {
      case 'incentive':
        data = await generateIncentiveReport(supabase, period)
        break
      case 'kpi-achievement':
        data = await generateKPIAchievementReport(supabase, period)
        break
      case 'unit-comparison':
        data = await generateUnitComparisonReport(supabase, period)
        break
      case 'employee-slip':
        data = await generateEmployeeSlipReport(supabase, period)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Check if data is empty (Requirement 12.7)
    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: `No data available for the selected period`,
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Generate Incentive Report
 * Requirement 12.2: Include employee name, unit, P1/P2/P3 scores, gross/tax/net incentive
 */
async function generateIncentiveReport(supabase: any, period: string) {
  const { data, error } = await supabase
    .from('t_calculation_results')
    .select(`
      employee_id,
      individual_score,
      gross_incentive,
      tax_amount,
      net_incentive,
      m_employees!inner (
        full_name,
        m_units!inner (
          name
        )
      ),
      t_individual_scores!inner (
        p1_score,
        p2_score,
        p3_score
      )
    `)
    .eq('period', period)

  if (error) throw error

  return data.map((row: any) => ({
    employee_name: row.m_employees.full_name,
    unit: row.m_employees.m_units.name,
    p1_score: parseFloat(row.t_individual_scores[0].p1_score).toFixed(2),
    p2_score: parseFloat(row.t_individual_scores[0].p2_score).toFixed(2),
    p3_score: parseFloat(row.t_individual_scores[0].p3_score).toFixed(2),
    gross_incentive: parseFloat(row.gross_incentive).toFixed(2),
    tax_amount: parseFloat(row.tax_amount).toFixed(2),
    net_incentive: parseFloat(row.net_incentive).toFixed(2),
  }))
}

/**
 * Generate KPI Achievement Report
 * Requirement 12.3: Display indicator name, target, realization, achievement %
 * Updated: Include data from both quantitative realization and qualitative assessments
 */
async function generateKPIAchievementReport(supabase: any, period: string) {
  // Fetch Realization Data (Quantitative)
  const { data: realizations, error: relError } = await supabase
    .from('t_realization')
    .select(`
      realization_value,
      achievement_percentage,
      m_kpi_indicators!inner (
        id,
        name,
        target_value
      )
    `)
    .eq('period', period)

  if (relError) throw relError

  // Fetch Assessment Data (Qualitative/Behavioral)
  const { data: assessments, error: assError } = await supabase
    .from('t_kpi_assessments')
    .select(`
      realization_value,
      achievement_percentage,
      m_kpi_indicators!inner (
        id,
        name,
        target_value
      )
    `)
    .eq('period', period)

  if (assError) throw assError

  // Merge Data
  const mergedData = new Map()

  // Add realizations
  realizations?.forEach((row: any) => {
    mergedData.set(row.m_kpi_indicators.id, {
      indicator_name: row.m_kpi_indicators.name,
      target_value: parseFloat(row.m_kpi_indicators.target_value).toFixed(2),
      realization_value: parseFloat(row.realization_value).toFixed(2),
      achievement_percentage: parseFloat(row.achievement_percentage || 0).toFixed(2) + '%',
    })
  })

  // Add/Override with assessments (assessments usually take precedence if both exist)
  assessments?.forEach((row: any) => {
    mergedData.set(row.m_kpi_indicators.id, {
      indicator_name: row.m_kpi_indicators.name,
      target_value: parseFloat(row.m_kpi_indicators.target_value).toFixed(2),
      realization_value: parseFloat(row.realization_value).toFixed(2),
      achievement_percentage: parseFloat(row.achievement_percentage || 0).toFixed(2) + '%',
    })
  })

  return Array.from(mergedData.values())
}

/**
 * Generate Unit Comparison Report
 * Requirement 12.4: Display unit name, average score, total incentive, employee count
 */
async function generateUnitComparisonReport(supabase: any, period: string) {
  const { data: units, error: unitsError } = await supabase
    .from('m_units')
    .select('id, name')
    .eq('is_active', true)

  if (unitsError) throw unitsError

  const results = []

  for (const unit of units) {
    // Get unit score
    const { data: unitScore } = await supabase
      .from('t_unit_scores')
      .select('total_score')
      .eq('unit_id', unit.id)
      .eq('period', period)
      .single()

    // Get employee count
    const { count: employeeCount } = await supabase
      .from('m_employees')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unit.id)
      .eq('is_active', true)

    // Get total incentive
    const { data: incentives } = await supabase
      .from('t_calculation_results')
      .select('net_incentive, m_employees!inner(unit_id)')
      .eq('period', period)
      .eq('m_employees.unit_id', unit.id)

    const totalIncentive = incentives?.reduce(
      (sum: number, row: any) => sum + parseFloat(row.net_incentive),
      0
    ) || 0

    const averageScore = unitScore?.total_score
      ? parseFloat(unitScore.total_score) / (employeeCount || 1)
      : 0

    results.push({
      unit_name: unit.name,
      average_score: averageScore.toFixed(2),
      total_incentive: totalIncentive.toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      employee_count: employeeCount || 0,
    })
  }

  return results
}

/**
 * Generate Employee Slip Report
 * Requirement 12.8: Include P1/P2/P3 breakdown with indicators and weights
 */
async function generateEmployeeSlipReport(supabase: any, period: string) {
  const { data, error } = await supabase
    .from('t_calculation_results')
    .select(`
      employee_id,
      gross_incentive,
      tax_amount,
      net_incentive,
      m_employees!inner (
        full_name,
        unit_id
      ),
      t_individual_scores!inner (
        p1_score,
        p2_score,
        p3_score,
        p1_weighted,
        p2_weighted,
        p3_weighted
      )
    `)
    .eq('period', period)

  if (error) throw error

  const results = []

  for (const row of data) {
    // Get P1, P2, P3 indicators for this employee's unit (from both realization and assessments)
    const { data: realizationIndicators } = await supabase
      .from('t_realization')
      .select(`
        realization_value,
        achievement_percentage,
        score,
        m_kpi_indicators!inner (
          id,
          name,
          weight_percentage,
          m_kpi_categories!inner (
            category
          )
        )
      `)
      .eq('employee_id', row.employee_id)
      .eq('period', period)

    const { data: assessmentIndicators } = await supabase
      .from('t_kpi_assessments')
      .select(`
        realization_value,
        achievement_percentage,
        score,
        m_kpi_indicators!inner (
          id,
          name,
          weight_percentage,
          m_kpi_categories!inner (
            category
          )
        )
      `)
      .eq('employee_id', row.employee_id)
      .eq('period', period)

    // Merge indicators
    const allIndicatorsMap = new Map()

    realizationIndicators?.forEach((i: any) => {
      allIndicatorsMap.set(i.m_kpi_indicators.id, i)
    })

    assessmentIndicators?.forEach((i: any) => {
      allIndicatorsMap.set(i.m_kpi_indicators.id, i)
    })

    const indicators = Array.from(allIndicatorsMap.values())

    const p1Indicators = indicators.filter(
      (i: any) => i.m_kpi_indicators.m_kpi_categories.category === 'P1'
    )
    const p2Indicators = indicators.filter(
      (i: any) => i.m_kpi_indicators.m_kpi_categories.category === 'P2'
    )
    const p3Indicators = indicators.filter(
      (i: any) => i.m_kpi_indicators.m_kpi_categories.category === 'P3'
    )

    results.push({
      employee_name: row.m_employees.full_name,
      p1_score: parseFloat(row.t_individual_scores[0].p1_score).toFixed(2),
      p1_weighted: parseFloat(row.t_individual_scores[0].p1_weighted).toFixed(2),
      p1_breakdown: p1Indicators.map((i: any) => ({
        indicator: i.m_kpi_indicators.name,
        weight: i.m_kpi_indicators.weight_percentage + '%',
        achievement: parseFloat(i.achievement_percentage || 0).toFixed(2) + '%',
        score: parseFloat(i.score || 0).toFixed(2),
      })),
      p2_score: parseFloat(row.t_individual_scores[0].p2_score).toFixed(2),
      p2_weighted: parseFloat(row.t_individual_scores[0].p2_weighted).toFixed(2),
      p2_breakdown: p2Indicators.map((i: any) => ({
        indicator: i.m_kpi_indicators.name,
        weight: i.m_kpi_indicators.weight_percentage + '%',
        achievement: parseFloat(i.achievement_percentage || 0).toFixed(2) + '%',
        score: parseFloat(i.score || 0).toFixed(2),
      })),
      p3_score: parseFloat(row.t_individual_scores[0].p3_score).toFixed(2),
      p3_weighted: parseFloat(row.t_individual_scores[0].p3_weighted).toFixed(2),
      p3_breakdown: p3Indicators.map((i: any) => ({
        indicator: i.m_kpi_indicators.name,
        weight: i.m_kpi_indicators.weight_percentage + '%',
        achievement: parseFloat(i.achievement_percentage || 0).toFixed(2) + '%',
        score: parseFloat(i.score || 0).toFixed(2),
      })),
      gross_incentive: parseFloat(row.gross_incentive).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      tax_amount: parseFloat(row.tax_amount).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      net_incentive: parseFloat(row.net_incentive).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    })
  }

  return results
}
