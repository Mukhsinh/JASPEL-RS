import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  totalEmployees: number
  totalUnits: number
  avgScore: number
  completionRate: number
  trends: {
    employees: number
    score: number
    completion: number
  }
}

export interface TopPerformer {
  id: string
  name: string
  unit: string
  score: number
  rank: number
}

export interface UnitPerformance {
  id: string
  name: string
  employeeCount: number
  avgScore: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'excellent' | 'good' | 'average' | 'poor'
}

export interface PerformanceData {
  month: string
  p1: number
  p2: number
  p3: number
  total: number
}

export interface Activity {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  description: string
  timestamp: string
}

export class DashboardService {
  private static async getCurrentPeriod(supabase: any): Promise<string> {
    const { data } = await supabase
      .from('t_kpi_assessments')
      .select('period')
      .order('period', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data?.period || new Date().toISOString().slice(0, 7)
  }

  private static async getResolvedPeriods(supabase: any, period?: string, year?: string): Promise<string[]> {
    if (!period || period === 'month') {
      const latest = await this.getCurrentPeriod(supabase);
      return [latest];
    }

    const targetYear = year || new Date().getFullYear().toString();

    if (period.startsWith('M-')) {
      const month = period.split('-')[1];
      return [`${targetYear}-${month}`];
    }

    if (period.startsWith('Q-')) {
      const q = parseInt(period.split('-')[1]);
      const months = [];
      for (let i = (q - 1) * 3 + 1; i <= q * 3; i++) {
        months.push(`${targetYear}-${String(i).padStart(2, '0')}`);
      }
      return months;
    }

    if (period.startsWith('S-')) {
      const s = parseInt(period.split('-')[1]);
      const months = [];
      for (let i = (s - 1) * 6 + 1; i <= s * 6; i++) {
        months.push(`${targetYear}-${String(i).padStart(2, '0')}`);
      }
      return months;
    }

    if (period === 'full-year') {
      const months = [];
      for (let i = 1; i <= 12; i++) {
        months.push(`${targetYear}-${String(i).padStart(2, '0')}`);
      }
      return months;
    }

    return [await this.getCurrentPeriod(supabase)];
  }

  /**
   * Get dashboard statistics for superadmin - using direct queries
   */
  static async getSuperadminStats(unitId?: string, period?: string, year?: string): Promise<DashboardStats> {
    const supabase = await createClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      // Parallel direct queries instead of RPC
      let empQuery = supabase.from('m_employees').select('id', { count: 'exact', head: true }).eq('is_active', true)
      let unitQuery = supabase.from('m_units').select('id', { count: 'exact', head: true }).eq('is_active', true)

      let assQuery = supabase
        .from('t_kpi_assessments')
        .select(`
          employee_id,
          weight_percentage,
          realization_value,
          target_value,
          m_kpi_indicators!inner (
            m_kpi_categories!inner (
              category,
              weight_percentage
            )
          )
        `)
        .in('period', resolvedPeriods)

      if (unitId) {
        empQuery = empQuery.eq('unit_id', unitId)
        // If filtering by unit, we only care about that 1 unit
        unitQuery = unitQuery.eq('id', unitId)

        const { data: emps } = await supabase.from('m_employees').select('id').eq('unit_id', unitId)
        const empIds = emps?.map((e: any) => e.id) || []
        assQuery = assQuery.in('employee_id', empIds)
      }

      const [employeesRes, unitsRes, assessmentsRes] = await Promise.all([
        empQuery,
        unitQuery,
        assQuery
      ])

      const totalEmployees = employeesRes.count || 0
      const totalUnits = unitsRes.count || 0

      const assessments = assessmentsRes.data || []

      const calcEmployeeTotalScore = (empId: string) => {
        const empAssessments = assessments.filter((a: any) => a.employee_id === empId)
        if (empAssessments.length === 0) return 0

        const calcCategoryScore = (categoryName: string) => {
          const catAssessments = empAssessments.filter((a: any) => {
            const indicator = Array.isArray(a.m_kpi_indicators) ? a.m_kpi_indicators[0] : a.m_kpi_indicators;
            const category = indicator?.m_kpi_categories;
            const catName = Array.isArray(category) ? category[0]?.category : category?.category;
            return catName === categoryName;
          })
          if (catAssessments.length === 0) return 0

          const firstAss = catAssessments[0] as any;
          const indicator = (Array.isArray(firstAss.m_kpi_indicators) ? firstAss.m_kpi_indicators[0] : firstAss.m_kpi_indicators) as any;
          const categoryObj = (indicator?.m_kpi_categories) as any;
          const categoryWeight = parseFloat(Array.isArray(categoryObj) ? categoryObj[0]?.weight_percentage : categoryObj?.weight_percentage) || 0

          let totalRealisasi = 0
          let totalTarget = 0

          for (const a of (catAssessments as any[])) {
            const indWeight = parseFloat(a.weight_percentage) || 0
            const indRealisasi = parseFloat(a.realization_value) || 0
            const indTarget = parseFloat(a.target_value) || 100
            totalRealisasi += indRealisasi * (indWeight / 100)
            totalTarget += indTarget * (indWeight / 100)
          }

          if (totalTarget > 0) {
            return (totalRealisasi / totalTarget) * categoryWeight
          }
          return 0
        }

        return calcCategoryScore('P1') + calcCategoryScore('P2') + calcCategoryScore('P3')
      }

      const uniqueAssessedEmployees = Array.from(new Set(assessments.map(a => a.employee_id)))
      const employeeScores = uniqueAssessedEmployees.map(empId => calcEmployeeTotalScore(empId as string))

      const avgScore = employeeScores.length > 0
        ? employeeScores.reduce((sum, score) => sum + score, 0) / employeeScores.length
        : 0

      const completionRate = totalEmployees > 0
        ? (uniqueAssessedEmployees.length / totalEmployees) * 100
        : 0

      return {
        totalEmployees,
        totalUnits,
        avgScore: Math.round(avgScore * 100) / 100,
        completionRate: Math.round(completionRate * 10) / 10,
        trends: {
          employees: 0,
          score: 0,
          completion: 0
        }
      }
    } catch (error) {
      console.error('Error in getSuperadminStats:', error)
      return this.getFallbackStats()
    }
  }

  /**
   * Fallback stats when queries fail
   */
  private static getFallbackStats(): DashboardStats {
    return {
      totalEmployees: 0,
      totalUnits: 0,
      avgScore: 0,
      completionRate: 0,
      trends: {
        employees: 0,
        score: 0,
        completion: 0
      }
    }
  }

  /**
   * Get top performers - using direct queries with joins
   */
  static async getTopPerformers(limit: number = 5, unitId?: string, period?: string, year?: string): Promise<TopPerformer[]> {
    const supabase = await createClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      // Get assessments for current period with employee and unit info
      let query = supabase
        .from('t_kpi_assessments')
        .select(`
          employee_id,
          weight_percentage,
          realization_value,
          target_value,
          m_employees!t_kpi_assessments_employee_id_fkey (
            id, full_name, is_active,
            unit_id,
            m_units!m_employees_unit_id_fkey ( name )
          ),
          m_kpi_indicators!inner (
            m_kpi_categories!inner (
              category,
              weight_percentage
            )
          )
        `)
        .in('period', resolvedPeriods)

      if (unitId) {
        const { data: emps } = await supabase.from('m_employees').select('id').eq('unit_id', unitId)
        const empIds = emps?.map((e: any) => e.id) || []
        query = query.in('employee_id', empIds)
      }

      const { data: assessments, error } = await query

      if (error) {
        console.error('Error fetching top performers:', error.message)
        return []
      }

      // Aggregate scores per employee using bottom-up system
      const employeeScores: Record<string, { name: string; unit: string; totalScore: number }> = {}

      // First, group assessments by employee
      const employeeAssessedMap = new Map<string, any[]>()
      for (const a of (assessments || [])) {
        const emp = a.m_employees as any
        if (!emp || !emp.is_active) continue

        const empId = emp.id
        if (!employeeAssessedMap.has(empId)) {
          employeeAssessedMap.set(empId, [])
          employeeScores[empId] = {
            name: emp.full_name || 'Unknown',
            unit: emp.m_units?.name || 'Unknown',
            totalScore: 0
          }
        }
        employeeAssessedMap.get(empId)!.push(a)
      }

      // Then calculate per employee score
      for (const [empId, acts] of employeeAssessedMap.entries()) {
        const calcCategoryScore = (categoryName: string) => {
          const catAssessments = acts.filter((a: any) => {
            const indicator = Array.isArray(a.m_kpi_indicators) ? a.m_kpi_indicators[0] : a.m_kpi_indicators;
            const categoryData = indicator?.m_kpi_categories;
            const catName = Array.isArray(categoryData) ? categoryData[0]?.category : categoryData?.category;
            return catName === categoryName;
          })
          if (catAssessments.length === 0) return 0

          const firstAss = catAssessments[0] as any;
          const indicator = (Array.isArray(firstAss.m_kpi_indicators) ? firstAss.m_kpi_indicators[0] : firstAss.m_kpi_indicators) as any;
          const categoryObj = indicator?.m_kpi_categories as any;
          const categoryWeight = parseFloat(Array.isArray(categoryObj) ? categoryObj[0]?.weight_percentage : categoryObj?.weight_percentage) || 0

          let totalRealisasi = 0
          let totalTarget = 0
          for (const a of (catAssessments as any[])) {
            const indWeight = parseFloat(a.weight_percentage) || 0
            const indRealisasi = parseFloat(a.realization_value) || 0
            const indTarget = parseFloat(a.target_value) || 100
            totalRealisasi += indRealisasi * (indWeight / 100)
            totalTarget += indTarget * (indWeight / 100)
          }
          if (totalTarget > 0) return (totalRealisasi / totalTarget) * categoryWeight
          return 0
        }

        employeeScores[empId].totalScore = calcCategoryScore('P1') + calcCategoryScore('P2') + calcCategoryScore('P3')
      }

      // Calculate averages & sort
      const sorted = Object.entries(employeeScores)
        .map(([id, data]) => ({
          id,
          name: data.name,
          unit: data.unit,
          score: Math.round(data.totalScore * 100) / 100
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return sorted.map((p, i) => ({ ...p, rank: i + 1 }))
    } catch (error) {
      console.error('Error in getTopPerformers:', error)
      return []
    }
  }

  /**
   * Get worst performers - using direct queries with joins
   */
  static async getWorstPerformers(limit: number = 5, unitId?: string, period?: string, year?: string): Promise<TopPerformer[]> {
    const supabase = await createClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      // Get assessments for current period
      let query = supabase
        .from('t_kpi_assessments')
        .select(`
          employee_id,
          weight_percentage,
          realization_value,
          target_value,
          m_employees!t_kpi_assessments_employee_id_fkey (
            id, full_name, is_active,
            unit_id,
            m_units!m_employees_unit_id_fkey ( name )
          ),
          m_kpi_indicators!inner (
            m_kpi_categories!inner (
              category,
              weight_percentage
            )
          )
        `)
        .in('period', resolvedPeriods)

      if (unitId) {
        const { data: emps } = await supabase.from('m_employees').select('id').eq('unit_id', unitId)
        const empIds = emps?.map((e: any) => e.id) || []
        query = query.in('employee_id', empIds)
      }

      const { data: assessments, error } = await query

      if (error) {
        console.error('Error fetching worst performers:', error.message)
        return []
      }

      // Aggregate scores per employee
      const employeeScores: Record<string, { name: string; unit: string; totalScore: number }> = {}

      // First, group assessments by employee
      const employeeAssessedMap = new Map<string, any[]>()
      for (const a of (assessments || [])) {
        const emp = a.m_employees as any
        if (!emp || !emp.is_active) continue

        const empId = emp.id
        if (!employeeAssessedMap.has(empId)) {
          employeeAssessedMap.set(empId, [])
          employeeScores[empId] = {
            name: emp.full_name || 'Unknown',
            unit: emp.m_units?.name || 'Unknown',
            totalScore: 0
          }
        }
        employeeAssessedMap.get(empId)!.push(a)
      }

      // Then calculate per employee score
      for (const [empId, acts] of employeeAssessedMap.entries()) {
        const calcCategoryScore = (categoryName: string) => {
          const catAssessments = acts.filter((a: any) => {
            const indicator = Array.isArray(a.m_kpi_indicators) ? a.m_kpi_indicators[0] : a.m_kpi_indicators;
            const categoryData = indicator?.m_kpi_categories;
            const catName = Array.isArray(categoryData) ? categoryData[0]?.category : categoryData?.category;
            return catName === categoryName;
          })
          if (catAssessments.length === 0) return 0

          const firstAss = catAssessments[0] as any;
          const indicator = (Array.isArray(firstAss.m_kpi_indicators) ? firstAss.m_kpi_indicators[0] : firstAss.m_kpi_indicators) as any;
          const categoryObj = indicator?.m_kpi_categories as any;
          const categoryWeight = parseFloat(Array.isArray(categoryObj) ? categoryObj[0]?.weight_percentage : categoryObj?.weight_percentage) || 0

          let totalRealisasi = 0
          let totalTarget = 0
          for (const a of (catAssessments as any[])) {
            const indWeight = parseFloat(a.weight_percentage) || 0
            const indRealisasi = parseFloat(a.realization_value) || 0
            const indTarget = parseFloat(a.target_value) || 100
            totalRealisasi += indRealisasi * (indWeight / 100)
            totalTarget += indTarget * (indWeight / 100)
          }
          if (totalTarget > 0) return (totalRealisasi / totalTarget) * categoryWeight
          return 0
        }

        employeeScores[empId].totalScore = calcCategoryScore('P1') + calcCategoryScore('P2') + calcCategoryScore('P3')
      }

      // Calculate averages & sort ascending (worst first)
      const sorted = Object.entries(employeeScores)
        .map(([id, data]) => ({
          id,
          name: data.name,
          unit: data.unit,
          score: Math.round(data.totalScore * 100) / 100
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)

      return sorted.map((p, i) => ({ ...p, rank: i + 1 }))
    } catch (error) {
      console.error('Error in getWorstPerformers:', error)
      return []
    }
  }
  static async getUnitPerformance(period?: string, year?: string): Promise<UnitPerformance[]> {
    const supabase = await createClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      // Get all active units with their employees
      const { data: units, error } = await supabase
        .from('m_units')
        .select(`
          id, name,
          m_employees!m_employees_unit_id_fkey ( id, is_active )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching units:', error.message)
        return []
      }

      // Get all assessments for current period
      const { data: assessments } = await supabase
        .from('t_kpi_assessments')
        .select(`
          employee_id,
          weight_percentage,
          realization_value,
          target_value,
          m_kpi_indicators!inner (
            m_kpi_categories!inner (
              category,
              weight_percentage
            )
          )
        `)
        .in('period', resolvedPeriods)

      // Build a map of employee_id -> assessments
      const employeeAssessedMap = new Map<string, any[]>()
      for (const a of (assessments || [])) {
        if (!employeeAssessedMap.has(a.employee_id)) {
          employeeAssessedMap.set(a.employee_id, [])
        }
        employeeAssessedMap.get(a.employee_id)!.push(a)
      }

      const calcEmployeeTotalScore = (empId: string) => {
        const empAssessments = employeeAssessedMap.get(empId) || []
        if (empAssessments.length === 0) return 0

        const calcCategoryScore = (categoryName: string) => {
          const catAssessments = empAssessments.filter((a: any) => {
            const indicator = Array.isArray(a.m_kpi_indicators) ? a.m_kpi_indicators[0] : a.m_kpi_indicators;
            const categoryData = indicator?.m_kpi_categories;
            const catName = Array.isArray(categoryData) ? categoryData[0]?.category : categoryData?.category;
            return catName === categoryName;
          })
          if (catAssessments.length === 0) return 0

          const firstAss = catAssessments[0];
          const indicator = Array.isArray(firstAss.m_kpi_indicators) ? firstAss.m_kpi_indicators[0] : firstAss.m_kpi_indicators;
          const categoryData = indicator?.m_kpi_categories;
          const categoryWeight = parseFloat(Array.isArray(categoryData) ? categoryData[0]?.weight_percentage : categoryData?.weight_percentage) || 0

          let totalRealisasi = 0
          let totalTarget = 0
          for (const a of catAssessments) {
            const indWeight = parseFloat(a.weight_percentage) || 0
            const indRealisasi = parseFloat(a.realization_value) || 0
            const indTarget = parseFloat(a.target_value) || 100
            totalRealisasi += indRealisasi * (indWeight / 100)
            totalTarget += indTarget * (indWeight / 100)
          }
          if (totalTarget > 0) return (totalRealisasi / totalTarget) * categoryWeight
          return 0
        }

        return calcCategoryScore('P1') + calcCategoryScore('P2') + calcCategoryScore('P3')
      }

      return (units || []).map(unit => {
        const employees = (unit.m_employees as any[]) || []
        const activeEmployees = employees.filter((e: any) => e.is_active)
        const employeeCount = activeEmployees.length

        // Calculate unit avg score from employee final scores
        let totalScore = 0
        let scoreCount = 0
        for (const emp of activeEmployees) {
          if (employeeAssessedMap.has(emp.id)) {
            totalScore += calcEmployeeTotalScore(emp.id)
            scoreCount += 1
          }
        }
        const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0

        const status = avgScore >= 90 ? 'excellent' :
          avgScore >= 80 ? 'good' :
            avgScore >= 70 ? 'average' : 'poor'

        return {
          id: unit.id,
          name: unit.name,
          employeeCount,
          avgScore: Math.round(avgScore * 100) / 100,
          trend: 'stable' as const,
          trendValue: 0,
          status: status as 'excellent' | 'good' | 'average' | 'poor'
        }
      })
    } catch (error) {
      console.error('Error in getUnitPerformance:', error)
      return []
    }
  }

  /**
   * Get performance trend data
   */
  static async getPerformanceTrend(months: number = 6, unitId?: string, period?: string, year?: string): Promise<PerformanceData[]> {
    const supabase = await createClient()

    try {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const data: PerformanceData[] = []

      // If a specific month period is selected (M-XX), use that as the end date
      // Otherwise use the latest period in resolvedPeriods
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)
      const lastPeriod = resolvedPeriods[resolvedPeriods.length - 1]

      const currentYear = parseInt(lastPeriod.slice(0, 4))
      const currentMonth = parseInt(lastPeriod.slice(5, 7)) - 1 // 0-based

      const endDate = new Date(currentYear, currentMonth, 1)

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
        const periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = monthNames[date.getMonth()]

        let q = supabase
          .from('t_kpi_assessments')
          .select(`
            score,
            m_kpi_indicators!t_kpi_assessments_indicator_id_fkey (
              m_kpi_categories!m_kpi_indicators_category_id_fkey (category)
            )
          `)
          .eq('period', periodStr)

        if (unitId) {
          const { data: emps } = await supabase.from('m_employees').select('id').eq('unit_id', unitId)
          const empIds = emps?.map((e: any) => e.id) || []
          q = q.in('employee_id', empIds)
        }

        const { data: assessments, error } = await q

        let p1 = 0, p2 = 0, p3 = 0, total = 0
        let p1Count = 0, p2Count = 0, p3Count = 0

        if (!error && assessments && assessments.length > 0) {
          assessments.forEach(a => {
            const indicator = (Array.isArray(a.m_kpi_indicators) ? a.m_kpi_indicators[0] : a.m_kpi_indicators) as any
            const categoryObj = indicator?.m_kpi_categories
            const category = Array.isArray(categoryObj) ? categoryObj[0]?.category : categoryObj?.category
            const score = a.score || 0

            if (category === 'P1') {
              p1 += score
              p1Count++
            } else if (category === 'P2') {
              p2 += score
              p2Count++
            } else if (category === 'P3') {
              p3 += score
              p3Count++
            }
            total += score
          })

          p1 = p1Count > 0 ? p1 / p1Count : 0
          p2 = p2Count > 0 ? p2 / p2Count : 0
          p3 = p3Count > 0 ? p3 / p3Count : 0
          total = assessments.length > 0 ? total / assessments.length : 0
        }

        data.push({
          month: monthName,
          p1: Math.round(p1 * 10) / 10,
          p2: Math.round(p2 * 10) / 10,
          p3: Math.round(p3 * 10) / 10,
          total: Math.round(total * 10) / 10
        })
      }

      return data
    } catch (error) {
      console.error('Error in getPerformanceTrend:', error)
      return []
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const supabase = await createClient()

    try {
      const { data: audits, error } = await supabase
        .from('t_audit_log')
        .select('id, operation, table_name, details, timestamp')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching audit logs:', error)
        return []
      }

      if (!audits || audits.length === 0) return []

      return audits.map(audit => {
        let type: Activity['type'] = 'info'
        const operation = audit.operation?.toLowerCase() || ''

        if (operation.includes('delete')) type = 'error'
        else if (operation.includes('create') || operation.includes('insert')) type = 'success'
        else if (operation.includes('update')) type = 'warning'

        const tableName = audit.table_name || 'unknown'
        const actionText = `${audit.operation} ${tableName.replace('t_', '').replace('m_', '')}`

        return {
          id: audit.id,
          type,
          title: actionText,
          description: audit.details || 'No details',
          timestamp: new Date(audit.timestamp).toLocaleString('id-ID')
        }
      })
    } catch (error) {
      console.error('Exception in getRecentActivities:', error)
      return []
    }
  }

  /**
   * Get KPI distribution data
   */
  static async getKPIDistribution(unitId?: string, period?: string, year?: string) {
    const supabase = await createClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      let query = supabase
        .from('t_kpi_assessments')
        .select(`
          score,
          m_kpi_indicators!t_kpi_assessments_indicator_id_fkey (
            m_kpi_categories!m_kpi_indicators_category_id_fkey (category)
          )
        `)
        .in('period', resolvedPeriods)

      if (unitId) {
        const { data: emps } = await supabase.from('m_employees').select('id').eq('unit_id', unitId)
        const empIds = emps?.map((e: any) => e.id) || []
        query = query.in('employee_id', empIds)
      }

      const { data: assessments, error } = await query

      let p1Total = 0, p2Total = 0, p3Total = 0

      if (!error && assessments && assessments.length > 0) {
        assessments.forEach(a => {
          const indicator = (Array.isArray(a.m_kpi_indicators) ? a.m_kpi_indicators[0] : a.m_kpi_indicators) as any
          const categoryObj = indicator?.m_kpi_categories
          const category = Array.isArray(categoryObj) ? categoryObj[0]?.category : categoryObj?.category
          const score = a.score || 0

          if (category === 'P1') p1Total += score
          else if (category === 'P2') p2Total += score
          else if (category === 'P3') p3Total += score
        })
      }

      return [
        { name: 'P1 (Posisi)', value: Math.round(p1Total), color: '#3b82f6' },
        { name: 'P2 (Kinerja)', value: Math.round(p2Total), color: '#10b981' },
        { name: 'P3 (Potensi)', value: Math.round(p3Total), color: '#f59e0b' }
      ]
    } catch (error) {
      console.error('Error in getKPIDistribution:', error)
      return [
        { name: 'P1 (Posisi)', value: 0, color: '#3b82f6' },
        { name: 'P2 (Kinerja)', value: 0, color: '#10b981' },
        { name: 'P3 (Potensi)', value: 0, color: '#f59e0b' }
      ]
    }
  }
}
