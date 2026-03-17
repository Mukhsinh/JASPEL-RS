import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { KPIDistributionChart } from '@/components/dashboard/KPIDistributionChart'
import { TopPerformers } from '@/components/dashboard/TopPerformers'
import { UnitPerformanceTable } from '@/components/dashboard/UnitPerformanceTable'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { DashboardService } from '@/lib/services/dashboard.service'

export async function DashboardContent() {
  try {
    const supabase = await createClient()
    
    // OPTIMIZED: Parallel data fetching
    const [
      { data: { user } },
      employeeResult
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('m_employees')
        .select(`
          id, 
          full_name, 
          role, 
          unit_id,
          m_units!m_employees_unit_id_fkey (
            name
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()
    ])
    
    if (!user) {
      redirect('/login')
    }
    
    const { data: employee, error } = employeeResult
    
    if (error || !employee) {
      console.error('Employee fetch error:', error)
      redirect('/login?error=user_not_found')
    }

    // Handle m_units yang bisa berupa object atau array
    const unitData = employee.m_units as any
    const unitName = unitData?.name || 'Unit tidak diketahui'

    let stats
    let topPerformers: any[] = []
    let unitPerformance: any[] = []
    let performanceTrend: any[] = []
    let kpiDistribution: any[] = []
    let recentActivities: any[] = []

    if (employee.role === 'superadmin') {
      try {
        // OPTIMIZED: Parallel data loading for dashboard
        const [
          dashboardStats,
          topPerformersData,
          unitPerformanceData,
          performanceTrendData,
          kpiDistributionData,
          recentActivitiesData
        ] = await Promise.allSettled([
          DashboardService.getSuperadminStats(),
          DashboardService.getTopPerformers(5),
          DashboardService.getUnitPerformance(),
          DashboardService.getPerformanceTrend(6),
          DashboardService.getKPIDistribution(),
          DashboardService.getRecentActivities(8)
        ])

        // Process results with fallbacks
        stats = dashboardStats.status === 'fulfilled' ? dashboardStats.value : await DashboardService.getSuperadminStats()
        topPerformers = topPerformersData.status === 'fulfilled' ? topPerformersData.value : []
        unitPerformance = unitPerformanceData.status === 'fulfilled' ? unitPerformanceData.value : []
        performanceTrend = performanceTrendData.status === 'fulfilled' ? performanceTrendData.value : []
        kpiDistribution = kpiDistributionData.status === 'fulfilled' ? kpiDistributionData.value : []
        recentActivities = recentActivitiesData.status === 'fulfilled' ? recentActivitiesData.value : []
      } catch (serviceError) {
        console.error('Dashboard service error:', serviceError)
        // Set default values if service fails
        stats = {
          totalEmployees: 0,
          totalUnits: 0,
          avgScore: 0,
          completionRate: 0,
          trends: { employees: 0, score: 0, completion: 0 }
        }
      }
    } else {
      stats = {
        totalEmployees: 0,
        totalUnits: 0,
        avgScore: 0,
        completionRate: 0,
        trends: { employees: 0, score: 0, completion: 0 }
      }
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Selamat datang, {employee.full_name} - {unitName}
          </p>
        </div>

        {employee.role === 'superadmin' && (
          <>
            <DashboardFilters 
              showUnitFilter={true}
              showPeriodFilter={true}
              showExport={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Pegawai"
                value={stats.totalEmployees}
                description="Pegawai aktif"
                iconName="Users"
                trend={{ value: stats.trends.employees, isPositive: true }}
              />
              <StatCard
                title="Total Unit"
                value={stats.totalUnits}
                description="Unit organisasi"
                iconName="Building2"
              />
              <StatCard
                title="Rata-rata Skor"
                value={stats.avgScore.toFixed(2)}
                description="Skor KPI keseluruhan"
                iconName="TrendingUp"
                trend={{ value: stats.trends.score, isPositive: true }}
              />
              <StatCard
                title="Tingkat Penyelesaian"
                value={`${stats.completionRate.toFixed(1)}%`}
                description="Penilaian selesai"
                iconName="CheckCircle"
                trend={{ value: stats.trends.completion, isPositive: true }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceChart 
                data={performanceTrend} 
                type="bar"
                title="Tren Performa KPI"
                description="Performa 6 bulan terakhir"
              />
              <KPIDistributionChart data={kpiDistribution} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UnitPerformanceTable units={unitPerformance} />
              </div>
              <div className="space-y-6">
                <TopPerformers performers={topPerformers} />
                <RecentActivity activities={recentActivities} />
              </div>
            </div>

            <QuickActions role="superadmin" />
          </>
        )}

        {employee.role === 'unit_manager' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Pegawai Unit"
                value="0"
                description="Total pegawai di unit Anda"
                iconName="Users"
              />
              <StatCard
                title="Realisasi Bulan Ini"
                value="0%"
                description="Progress input realisasi"
                iconName="Target"
              />
              <StatCard
                title="Skor Rata-rata Unit"
                value="0"
                description="Performa unit Anda"
                iconName="Award"
              />
            </div>
            <QuickActions role="unit_manager" />
          </>
        )}

        {employee.role === 'employee' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Skor KPI Anda"
                value="0"
                description="Skor terakhir"
                iconName="Award"
              />
              <StatCard
                title="Ranking"
                value="-"
                description="Posisi di unit"
                iconName="TrendingUp"
              />
              <StatCard
                title="Status"
                value="Aktif"
                description="Status kepegawaian"
                iconName="Activity"
              />
            </div>
            <QuickActions role="employee" />
          </>
        )}
      </div>
    )
  } catch (error) {
    console.error('Fatal dashboard error:', error)
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Memuat Dashboard</h2>
          <p className="text-red-600">Terjadi kesalahan saat memuat dashboard. Silakan refresh halaman atau hubungi administrator.</p>
        </div>
      </div>
    )
  }
}
