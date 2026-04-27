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
 * Calculates dynamic incentives using the formula:
 * (Employee Score / 100) * (Unit Prop / 100) * Pool Nominal
 */
async function generateIncentiveReport(supabase: any, period: string) {
  // 1. Get Pool
  const { data: poolData, error: poolError } = await supabase
    .from('t_pool')
    .select('net_pool')
    .eq('period', period)
    .maybeSingle()

  if (poolError) {
    console.error('Error fetching pool data:', poolError)
  }

  const defaultPool = poolData?.net_pool || 0

  // 2. Get Employees and their Units
  const { data: employees, error: empError } = await supabase
    .from('m_employees')
    .select(`
      id,
      full_name,
      m_units (
        id,
        name,
        proportion_percentage
      )
    `)

  if (empError) {
    console.error('Error fetching employees:', empError)
    throw new Error('Failed to fetch employee data')
  }

  // 3. Get Assessments for the period
  const { data: assessments, error: assError } = await supabase
    .from('t_kpi_assessments')
    .select(`
      employee_id,
      score,
      weight_percentage
    `)
    .eq('period', period)

  if (assError) {
    console.error('Error fetching assessments:', assError)
    throw new Error('Failed to fetch assessment data')
  }

  if (!employees) return []

  const report = []

  for (const emp of employees) {
    if (!emp.m_units) continue

    const empAssessments = assessments?.filter((a: any) => a.employee_id === emp.id) || []

    if (empAssessments.length === 0) continue

    let totalScore = 0
    empAssessments.forEach((a: any) => {
      totalScore += (a.score || 0)
    })

    const unitProp = Array.isArray(emp.m_units) ? (emp.m_units[0]?.proportion_percentage || 0) : (emp.m_units.proportion_percentage || 0)
    const unitName = Array.isArray(emp.m_units) ? (emp.m_units[0]?.name || '-') : (emp.m_units.name || '-')
    const grossIncentive = (totalScore / 100) * (unitProp / 100) * defaultPool

    // Very simple tax mock (could dynamically fetch if needed)
    const taxAmount = 0
    const netIncentive = grossIncentive - taxAmount

    report.push({
      employee_name: emp.full_name,
      unit: unitName,
      total_score: totalScore.toFixed(2),
      p1_score: '-',
      p2_score: '-',
      p3_score: '-',
      gross_incentive: grossIncentive.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      net_incentive: netIncentive.toFixed(2),
    })
  }

  return report
}

/**
 * Generate KPI Achievement Report
 * Averages out achievement per indicator across all employees in the period.
 */
async function generateKPIAchievementReport(supabase: any, period: string) {
  // Fetch Assessment Data
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

  assessments?.forEach((row: any) => {
    const indicatorId = row.m_kpi_indicators.id
    const existing = mergedData.get(indicatorId)

    if (existing) {
      existing.count++
      existing.sum_realization += Number(row.realization_value || 0)
      existing.sum_achievement += Number(row.achievement_percentage || 0)
    } else {
      mergedData.set(indicatorId, {
        indicator_name: row.m_kpi_indicators.name,
        target_value: parseFloat(row.m_kpi_indicators.target_value).toFixed(2),
        count: 1,
        sum_realization: Number(row.realization_value || 0),
        sum_achievement: Number(row.achievement_percentage || 0),
      })
    }
  })

  // Format array for report
  const reportArray = Array.from(mergedData.values()).map(item => ({
    indicator_name: item.indicator_name,
    target_value: item.target_value,
    realization_value: (item.sum_realization / item.count).toFixed(2),
    achievement_percentage: (item.sum_achievement / item.count).toFixed(2) + '%'
  }))

  return reportArray
}

/**
 * Generate Unit Comparison Report
 * Uses the dynamically calculated incentive report data to aggregate by unit.
 */
async function generateUnitComparisonReport(supabase: any, period: string) {
  // Reuse the dynamic incentive generation logic
  const topLevelData = await generateIncentiveReport(supabase, period)

  // Aggregate by unit
  const unitMap = new Map()

  topLevelData.forEach(row => {
    const uName = row.unit
    if (!unitMap.has(uName)) {
      unitMap.set(uName, {
        unit_name: uName,
        total_score_sum: 0,
        total_incentive_sum: 0,
        employee_count: 0
      })
    }

    const u = unitMap.get(uName)
    u.total_score_sum += parseFloat(row.total_score || '0')
    u.total_incentive_sum += parseFloat(row.net_incentive || '0')
    u.employee_count++
  })

  // Format Array
  return Array.from(unitMap.values()).map(u => ({
    unit_name: u.unit_name,
    average_score: u.employee_count > 0 ? (u.total_score_sum / u.employee_count).toFixed(2) : '0.00',
    total_incentive: u.total_incentive_sum.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    employee_count: u.employee_count
  }))
}

/**
 * Generate Employee Slip Report
 * Dynamically calculating P1/P2/P3 breakdown and merging with incentive data.
 */
async function generateEmployeeSlipReport(supabase: any, period: string) {
  // Reuse the dynamic total calculations
  const topLevelData = await generateIncentiveReport(supabase, period)

  // Fetch all assessments for this period to do the categorical breakdown
  const { data: assessments } = await supabase
    .from('t_kpi_assessments')
    .select(`
      employee_id,
      realization_value,
      achievement_percentage,
      score,
      m_kpi_indicators!inner (
        name,
        weight_percentage,
        m_kpi_categories!inner (
          category
        )
      )
    `)
    .eq('period', period)

  if (!assessments) return []

  const results = []

  // Create employee map for matching
  const { data: employees } = await supabase.from('m_employees').select('id, full_name')
  const empMap = new Map()
  employees?.forEach((e: any) => empMap.set(e.full_name, e.id))

  for (const row of topLevelData) {
    const empId = empMap.get(row.employee_name)
    const empAssessments = assessments.filter((a: any) => a.employee_id === empId)

    const p1Indicators = empAssessments.filter((i: any) => i.m_kpi_indicators.m_kpi_categories.category === 'P1')
    const p2Indicators = empAssessments.filter((i: any) => i.m_kpi_indicators.m_kpi_categories.category === 'P2')
    const p3Indicators = empAssessments.filter((i: any) => i.m_kpi_indicators.m_kpi_categories.category === 'P3')

    const calcSum = (arr: any[]) => arr.reduce((sum, item) => sum + (parseFloat(item.score) || 0), 0)

    results.push({
      employee_name: row.employee_name,
      p1_score: calcSum(p1Indicators).toFixed(2),
      p1_weighted: calcSum(p1Indicators).toFixed(2), // Same for dynamic calculate unless weights differ
      p1_breakdown: p1Indicators.map((i: any) => ({
        indicator: i.m_kpi_indicators.name,
        weight: i.m_kpi_indicators.weight_percentage + '%',
        achievement: parseFloat(i.achievement_percentage || 0).toFixed(2) + '%',
        score: parseFloat(i.score || 0).toFixed(2),
      })),
      p2_score: calcSum(p2Indicators).toFixed(2),
      p2_weighted: calcSum(p2Indicators).toFixed(2),
      p2_breakdown: p2Indicators.map((i: any) => ({
        indicator: i.m_kpi_indicators.name,
        weight: i.m_kpi_indicators.weight_percentage + '%',
        achievement: parseFloat(i.achievement_percentage || 0).toFixed(2) + '%',
        score: parseFloat(i.score || 0).toFixed(2),
      })),
      p3_score: calcSum(p3Indicators).toFixed(2),
      p3_weighted: calcSum(p3Indicators).toFixed(2),
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
