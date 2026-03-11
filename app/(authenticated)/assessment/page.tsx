import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AssessmentPageContent from '@/components/assessment/AssessmentPageContent'

// Import function secara langsung untuk menghindari module resolution issue
async function getAvailablePeriods(): Promise<string[]> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('t_pool')
      .select('period')
      .in('status', ['approved', 'distributed'])
      .order('period', { ascending: false })

    if (error) {
      console.error('Error fetching periods:', error)
      return []
    }
    
    return data?.map(item => item.period) || []
  } catch (error) {
    console.error('Exception in getAvailablePeriods:', error)
    return []
  }
}

export default async function AssessmentPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  // Get current user's employee record
  const { data: currentEmployee } = await supabase
    .from('m_employees')
    .select('id, role, unit_id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!currentEmployee) {
    redirect('/forbidden')
  }

  // Check if user has assessment permissions
  if (!['superadmin', 'unit_manager'].includes(currentEmployee.role)) {
    redirect('/forbidden')
  }

  // Get available periods
  const availablePeriods = await getAvailablePeriods()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Penilaian KPI</h1>
        <p className="text-gray-600">
          Kelola penilaian kinerja pegawai berdasarkan indikator KPI yang telah dikonfigurasi
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AssessmentPageContent 
          currentEmployee={currentEmployee}
          availablePeriods={availablePeriods}
        />
      </Suspense>
    </div>
  )
}