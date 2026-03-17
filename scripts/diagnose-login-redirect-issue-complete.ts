import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

async function diagnoseLoginRedirectIssue() {
  console.log('=== DIAGNOSA MASALAH LOGIN REDIRECT ===\n')

  try {
    // 1. Test client-side session
    console.log('1. Memeriksa sesi client-side...')
    const clientSupabase = createClient()
    const { data: clientSession, error: clientError } = await clientSupabase.auth.getSession()
    
    console.log('Client session:', {
      hasSession: !!clientSession.session,
      hasUser: !!clientSession.session?.user,
      userId: clientSession.session?.user?.id,
      email: clientSession.session?.user?.email,
      role: clientSession.session?.user?.user_metadata?.role,
      error: clientError?.message
    })

    if (!clientSession.session) {
      console.log('❌ Tidak ada sesi client-side - user perlu login ulang')
      return
    }

    // 2. Test server-side session
    console.log('\n2. Memeriksa sesi server-side...')
    try {
      const serverSupabase = await createServerClient()
      const { data: serverSession, error: serverError } = await serverSupabase.auth.getUser()
      
      console.log('Server session:', {
        hasUser: !!serverSession.user,
        userId: serverSession.user?.id,
        email: serverSession.user?.email,
        role: serverSession.user?.user_metadata?.role,
        error: serverError?.message
      })
    } catch (serverErr) {
      console.log('❌ Error server session:', serverErr)
    }

    // 3. Test employee data
    console.log('\n3. Memeriksa data employee...')
    const { data: employee, error: employeeError } = await clientSupabase
      .from('m_employees')
      .select('id, full_name, unit_id, is_active, user_id')
      .eq('user_id', clientSession.session.user.id)
      .single()

    console.log('Employee data:', {
      found: !!employee,
      id: employee?.id,
      name: employee?.full_name,
      unitId: employee?.unit_id,
      isActive: employee?.is_active,
      userId: employee?.user_id,
      error: employeeError?.message
    })

    if (!employee) {
      console.log('❌ Data employee tidak ditemukan')
      return
    }

    if (!employee.is_active) {
      console.log('❌ Employee tidak aktif')
      return
    }

    // 4. Test cookies
    console.log('\n4. Memeriksa cookies...')
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
      }, {} as Record<string, string>)

      const authCookies = Object.keys(cookies).filter(name => 
        name.includes('sb-') || name.includes('supabase') || name.includes('auth')
      )

      console.log('Auth cookies found:', authCookies.length)
      authCookies.forEach(name => {
        console.log(`  ${name}: ${cookies[name] ? 'present' : 'missing'}`)
      })
    }

    // 5. Test middleware logic simulation
    console.log('\n5. Simulasi logika middleware...')
    
    // Check if user has role
    const role = clientSession.session.user.user_metadata?.role
    if (!role) {
      console.log('❌ Role tidak ditemukan di user_metadata')
      console.log('user_metadata:', clientSession.session.user.user_metadata)
      console.log('raw_user_meta_data:', clientSession.session.user.raw_user_meta_data)
      return
    }

    console.log('✅ Role ditemukan:', role)

    // 6. Test route access
    console.log('\n6. Memeriksa akses route...')
    const testRoutes = ['/dashboard', '/units', '/kpi-config', '/pool']
    
    for (const route of testRoutes) {
      try {
        const response = await fetch(route, {
          method: 'HEAD',
          credentials: 'include'
        })
        console.log(`${route}: ${response.status} ${response.statusText}`)
      } catch (err) {
        console.log(`${route}: Error - ${err}`)
      }
    }

    // 7. Test dashboard page specifically
    console.log('\n7. Test akses dashboard...')
    try {
      const dashboardResponse = await fetch('/dashboard', {
        credentials: 'include',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })
      
      console.log('Dashboard response:', {
        status: dashboardResponse.status,
        statusText: dashboardResponse.statusText,
        redirected: dashboardResponse.redirected,
        url: dashboardResponse.url,
        headers: Object.fromEntries(dashboardResponse.headers.entries())
      })

      if (dashboardResponse.redirected) {
        console.log('❌ Dashboard redirect ke:', dashboardResponse.url)
      } else {
        console.log('✅ Dashboard dapat diakses')
      }
    } catch (err) {
      console.log('❌ Error mengakses dashboard:', err)
    }

    // 8. Test session refresh
    console.log('\n8. Test refresh session...')
    try {
      const { data: refreshData, error: refreshError } = await clientSupabase.auth.refreshSession()
      console.log('Session refresh:', {
        success: !refreshError,
        hasSession: !!refreshData.session,
        error: refreshError?.message
      })
    } catch (err) {
      console.log('❌ Error refresh session:', err)
    }

    // 9. Recommendations
    console.log('\n=== REKOMENDASI PERBAIKAN ===')
    
    if (!role) {
      console.log('1. ❌ Role tidak ada - perlu update user metadata')
    } else {
      console.log('1. ✅ Role tersedia:', role)
    }

    if (!employee) {
      console.log('2. ❌ Data employee tidak ada - perlu dibuat')
    } else if (!employee.is_active) {
      console.log('2. ❌ Employee tidak aktif - perlu diaktifkan')
    } else {
      console.log('2. ✅ Employee data valid')
    }

    console.log('\nKemungkinan penyebab redirect loop:')
    console.log('- Middleware tidak dapat membaca session cookies dengan benar')
    console.log('- Race condition antara client dan server session')
    console.log('- Cookie domain/path tidak sesuai')
    console.log('- Session tidak ter-persist setelah login')

  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
  }
}

// Run diagnosis
diagnoseLoginRedirectIssue()