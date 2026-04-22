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
   * Get dashboard statistics for superadmin - OPTIMIZED with single query
   */
  static async getSuperadminStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    try {
      // Use single optimized query instead of multiple RPC calls
      const { data: stats, error } = await supabase
        .rpc('get_dashboard_stats_optimized')
        .single()

      if (error) {
        console.error('Error getting dashboard stats (RPC get_dashboard_stats_optimized failed):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return this.getFallbackStats()
      }

      if (!stats) {
        return this.getFallbackStats()
      }

      return {
        totalEmployees: Number((stats as any).total_employees) || 0,
        totalUnits: Number((stats as any).total_units) || 0,
        avgScore: Math.round(Number((stats as any).avg_score) * 100) / 100,
        completionRate: Math.round(Number((stats as any).completion_rate) * 10) / 10,
        trends: {
          employees: Number((stats as any).employee_trend) || 0,
          score: Number((stats as any).score_trend) || 0,
          completion: Number((stats as any).completion_trend) || 0
        }
      }
    } catch (error) {
      console.error('Error in getSuperadminStats:', error)
      return this.getFallbackStats()
    }
  }

  /**
   * Fallback stats when RPC fails
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
   * Get top performers - OPTIMIZED with database aggregation
   */
  static async getTopPerformers(limit: number = 5): Promise<TopPerformer[]> {
    const supabase = await createClient()

    try {
      // Use database aggregation for better performance
      const { data: topPerformers, error } = await supabase
        .rpc('get_top_performers', { performer_limit: limit })

      if (error) {
        console.error('Error fetching top performers (RPC get_top_performers failed):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return []
      }

      return (topPerformers || []).map((performer: any, index: number) => ({
        id: performer.employee_id?.toString() || '',
        name: performer.employee_name || 'Unknown',
        unit: performer.unit_name || 'Unknown',
        score: Math.round((performer.avg_score || 0) * 100) / 100,
        rank: index + 1
      }))
    } catch (error) {
      console.error('Error in getTopPerformers:', error)
      return []
    }
  }

  /**
   * Get unit performance data - OPTIMIZED with single query
   */
  static async getUnitPerformance(): Promise<UnitPerformance[]> {
    const supabase = await createClient()

    try {
      // Use optimized database function
      const { data: unitStats, error } = await supabase
        .rpc('get_unit_performance_stats')

      if (error) {
        console.error('Error fetching unit performance (RPC get_unit_performance_stats failed):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        // Fallback to basic query if RPC fails
        const { data: units } = await supabase
          .from('m_units')
          .select('id, name')
          .eq('is_active', true)
          .limit(10) // Limit for performance

        return (units || []).map(unit => ({
          id: unit.id,
          name: unit.name,
          employeeCount: 0,
          avgScore: 0,
          trend: 'stable' as const,
          trendValue: 0,
          status: 'average' as const
        }))
      }

      return (unitStats || []).map((unit: any) => {
        const status = unit.avg_score >= 4 ? 'excellent' :
          unit.avg_score >= 3 ? 'good' :
            unit.avg_score >= 2 ? 'average' : 'poor'

        return {
          id: unit.unit_id?.toString() || '',
          name: unit.unit_name,
          employeeCount: unit.employee_count || 0,
          avgScore: Math.round((unit.avg_score || 0) * 100) / 100,
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
