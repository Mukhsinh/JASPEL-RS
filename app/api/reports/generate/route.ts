import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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

    const supabase = await createAdminClient()

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
      employee_code,
      full_name,
      m_units (
        id,
        name,
        proportion_percentage
      )
    `)
    .eq('is_active', true)

  if (empError) {
    console.error('Error fetching employees:', empError)
    throw new Error('Failed to fetch employee data')
  }

  // 3. Get Assessments for the period with category info
  const { data: assessments, error: assError } = await supabase
    .from('t_kpi_assessments')
    .select(`
      employee_id,
      score,
      weight_percentage,
      achievement_percentage,
      m_kpi_indicators!inner (
        m_kpi_categories!inner (
          category,
          weight_percentage
        )
      )
    `)
    .eq('period', period)

  if (assError) {
    console.error('Error fetching assessments:', assError)
    throw new Error('Failed to fetch assessment data')
  }

  if (!employees) return []

  const report = []

  // Maps to store computed data for two-pass calculation
  const employeeScoresMap = new Map()
  const unitTotalScoresMap = new Map()

  // First pass: Calculate Total Score for each employee and accumulate Unit Total Score
  for (const emp of employees) {
    if (!emp.m_units) continue

    const empAssessments = assessments?.filter((a: any) => a.employee_id === emp.id) || []

    const calcCategoryScore = (categoryName: string) => {
      const catAssessments = empAssessments.filter((a: any) => a.m_kpi_indicators?.m_kpi_categories?.category === categoryName)
      if (catAssessments.length === 0) return 0

      const categoryWeight = parseFloat(catAssessments[0].m_kpi_indicators.m_kpi_categories.weight_percentage) || 0

      let indicatorSum = 0
      for (const a of catAssessments) {
        const indWeight = parseFloat(a.weight_percentage) || 0
        const achieve = parseFloat(a.achievement_percentage) || 0
        let evalScore = Math.min(indWeight, (achieve / 100) * indWeight)
        indicatorSum += evalScore
      }

      return (indicatorSum / 100) * categoryWeight
    }

    // Calculate categorical scores
    const p1Score = calcCategoryScore('P1')
    const p2Score = calcCategoryScore('P2')
    const p3Score = calcCategoryScore('P3')

    const totalScore = p1Score + p2Score + p3Score

    const unitId = Array.isArray(emp.m_units) ? emp.m_units[0]?.id : emp.m_units.id

    employeeScoresMap.set(emp.id, {
      emp,
      p1Score,
      p2Score,
      p3Score,
      totalScore,
      empAssessmentsCount: empAssessments.length
    })

    if (unitTotalScoresMap.has(unitId)) {
      unitTotalScoresMap.set(unitId, unitTotalScoresMap.get(unitId) + totalScore)
    } else {
      unitTotalScoresMap.set(unitId, totalScore)
    }
  }

  // Second pass: Calculate Gross Incentive for each employee based on their unit's total score
  for (const [empId, data] of employeeScoresMap.entries()) {
    const { emp, p1Score, p2Score, p3Score, totalScore, empAssessmentsCount } = data

    if (totalScore === 0 && empAssessmentsCount === 0) continue

    const unitId = Array.isArray(emp.m_units) ? emp.m_units[0]?.id : emp.m_units.id
    const unitTotalScore = unitTotalScoresMap.get(unitId) || 0

    const unitProp = Array.isArray(emp.m_units) ? (emp.m_units[0]?.proportion_percentage || 0) : (emp.m_units.proportion_percentage || 0)
    const unitName = Array.isArray(emp.m_units) ? (emp.m_units[0]?.name || '-') : (emp.m_units.name || '-')

    // Formula: (Employee Total Score / Unit Total Score) * (Unit Prop / 100) * Total Pool
    // Avoid division by zero! If unitTotalScore is 0 (which means all employees have 0), gross incentive is 0.
    const scoreRatio = unitTotalScore > 0 ? (totalScore / unitTotalScore) : 0
    const grossIncentive = scoreRatio * (unitProp / 100) * defaultPool

    // Very simple tax mock (can be enhanced if tax settings are available)
    const taxAmount = 0
    const netIncentive = grossIncentive - taxAmount

    report.push({
      employee_code: emp.employee_code || '-',
      employee_name: emp.full_name,
      unit: unitName,
      p1_score: p1Score.toFixed(2),
      p2_score: p2Score.toFixed(2),
      p3_score: p3Score.toFixed(2),
      total_score: totalScore.toFixed(2),
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
        target_value,
        m_kpi_categories (
          category
        )
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
    total_incentive: u.total_incentive_sum.toFixed(2),
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

    const mapIndicator = (i: any) => {
      const indWeight = parseFloat(i.m_kpi_indicators.weight_percentage) || 0
      const achieve = parseFloat(i.achievement_percentage) || 0
      let evalScore = Math.min(indWeight, (achieve / 100) * indWeight)

      return {
        indicator: i.m_kpi_indicators.name,
        weight: indWeight + '%',
        achievement: achieve.toFixed(2) + '%',
        score: evalScore.toFixed(2),
      }
    }

    results.push({
      employee_name: row.employee_name,
      p1_score: parseFloat(row.p1_score || 0).toFixed(2),
      p1_weighted: parseFloat(row.p1_score || 0).toFixed(2), // The main incentive report now properly weights P1
      p1_breakdown: p1Indicators.map(mapIndicator),
      p2_score: parseFloat(row.p2_score || 0).toFixed(2),
      p2_weighted: parseFloat(row.p2_score || 0).toFixed(2),
      p2_breakdown: p2Indicators.map(mapIndicator),
      p3_score: parseFloat(row.p3_score || 0).toFixed(2),
      p3_weighted: parseFloat(row.p3_score || 0).toFixed(2),
      p3_breakdown: p3Indicators.map(mapIndicator),
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
