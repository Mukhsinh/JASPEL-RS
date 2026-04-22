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
  /**
   * Get dashboard statistics for superadmin - using direct queries
   */
  static async getSuperadminStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    try {
      const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM

      // Parallel direct queries instead of RPC
      const [employeesRes, unitsRes, assessmentsRes] = await Promise.all([
        supabase.from('m_employees').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('m_units').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('t_kpi_assessments').select('score, employee_id').eq('period', currentPeriod)
      ])

      const totalEmployees = employeesRes.count || 0
      const totalUnits = unitsRes.count || 0

      const assessments = assessmentsRes.data || []
      const avgScore = assessments.length > 0
        ? assessments.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / assessments.length
        : 0

      const uniqueAssessedEmployees = new Set(assessments.map(a => a.employee_id)).size
      const completionRate = totalEmployees > 0
        ? (uniqueAssessedEmployees / totalEmployees) * 100
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
  static async getTopPerformers(limit: number = 5): Promise<TopPerformer[]> {
    const supabase = await createClient()

    try {
      const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM

      // Get assessments for current period with employee and unit info
      const { data: assessments, error } = await supabase
        .from('t_kpi_assessments')
        .select(`
          score,
          employee_id,
          m_employees!t_kpi_assessments_employee_id_fkey (
            id, full_name, is_active,
            m_units!m_employees_unit_id_fkey ( name )
          )
        `)
        .eq('period', currentPeriod)

      if (error) {
        console.error('Error fetching top performers:', error.message)
        return []
      }

      // Aggregate scores per employee
      const employeeScores: Record<string, { name: string; unit: string; scores: number[] }> = {}

      for (const a of (assessments || [])) {
        const emp = a.m_employees as any
        if (!emp || !emp.is_active) continue

        const empId = emp.id
        if (!employeeScores[empId]) {
          employeeScores[empId] = {
            name: emp.full_name || 'Unknown',
            unit: emp.m_units?.name || 'Unknown',
            scores: []
          }
        }
        employeeScores[empId].scores.push(Number(a.score) || 0)
      }

      // Calculate averages & sort
      const sorted = Object.entries(employeeScores)
        .map(([id, data]) => ({
          id,
          name: data.name,
          unit: data.unit,
          score: Math.round((data.scores.reduce((s, v) => s + v, 0) / data.scores.length) * 100) / 100
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
   * Get unit performance data - using direct queries
   */
  static async getUnitPerformance(): Promise<UnitPerformance[]> {
    const supabase = await createClient()

    try {
      const currentPeriod = new Date().toISOString().slice(0, 7)

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
        .select('employee_id, score')
        .eq('period', currentPeriod)

      // Build a map of employee_id -> scores
      const empScoreMap: Record<string, number[]> = {}
      for (const a of (assessments || [])) {
        if (!empScoreMap[a.employee_id]) empScoreMap[a.employee_id] = []
        empScoreMap[a.employee_id].push(Number(a.score) || 0)
      }

      return (units || []).map(unit => {
        const employees = (unit.m_employees as any[]) || []
        const activeEmployees = employees.filter((e: any) => e.is_active)
        const employeeCount = activeEmployees.length

        // Calculate unit avg score from assessments
        let totalScore = 0
        let scoreCount = 0
        for (const emp of activeEmployees) {
          const scores = empScoreMap[emp.id]
          if (scores) {
            totalScore += scores.reduce((s, v) => s + v, 0)
            scoreCount += scores.length
          }
        }
        const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0

        const status = avgScore >= 4 ? 'excellent' :
          avgScore >= 3 ? 'good' :
            avgScore >= 2 ? 'average' : 'poor'

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
  static async getPerformanceTrend(months: number = 6): Promise<PerformanceData[]> {
    const supabase = await createClient()

    try {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const data: PerformanceData[] = []

      const currentDate = new Date()

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthName = monthNames[date.getMonth()]

        // Get assessments for this month
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const { data: assessments, error } = await supabase
          .from('t_kpi_assessments')
          .select(`
            score,
            m_kpi_indicators!t_kpi_assessments_indicator_id_fkey (
              m_kpi_categories!m_kpi_indicators_category_id_fkey (category)
            )
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        let p1 = 0, p2 = 0, p3 = 0, total = 0
        let p1Count = 0, p2Count = 0, p3Count = 0

        if (!error && assessments && assessments.length > 0) {
          assessments.forEach(a => {
            const indicator = a.m_kpi_indicators as any
            const category = indicator?.m_kpi_categories?.category
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
  static async getKPIDistribution() {
    const supabase = await createClient()

    try {
      const { data: assessments, error } = await supabase
        .from('t_kpi_assessments')
        .select(`
          score,
          m_kpi_indicators!t_kpi_assessments_indicator_id_fkey (
            m_kpi_categories!m_kpi_indicators_category_id_fkey (category)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      let p1Total = 0, p2Total = 0, p3Total = 0

      if (!error && assessments && assessments.length > 0) {
        assessments.forEach(a => {
          const indicator = a.m_kpi_indicators as any
          const category = indicator?.m_kpi_categories?.category
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
