import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { 
  isPublicRoute, 
  isLegacyRoute, 
  getLegacyRedirectPath,
  isRouteAllowed 
} from '@/lib/services/route-config.service'
import type { Role } from '@/lib/services/rbac.service'

// Simple in-memory cache for employee data
const employeeCache = new Map<string, {
  role: Role
  is_active: boolean
  timestamp: number
}>()

const CACHE_TTL = 15 * 60 * 1000 // 15 minutes
const MAX_CACHE_SIZE = 1000 // Maximum cache entries

function cleanupCache() {
  if (employeeCache.size > MAX_CACHE_SIZE) {
    // Sort by timestamp (oldest first) and remove oldest half
    const entries = Array.from(employeeCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    toDelete.forEach(([key]) => employeeCache.delete(key))
  }
}

function getCachedEmployee(userId: string) {
  const cached = employeeCache.get(userId)
  if (!cached) return null
  
  const age = Date.now() - cached.timestamp
  if (age > CACHE_TTL) {
    employeeCache.delete(userId)
    return null
  }
  
  return cached
}

function setCachedEmployee(userId: string, role: Role, is_active: boolean) {
  cleanupCache() // Clean up old entries if cache is too large
  employeeCache.set(userId, {
    role,
    is_active,
    timestamp: Date.now()
  })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // 0. Skip middleware for static assets and favicon
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.') // Any file with extension (images, fonts, etc.)
    ) {
      return response
    }

    // 1. Check if public route (login, reset-password, forbidden)
    if (isPublicRoute(pathname)) {
      return response
    }

    // 2. Check for legacy routes and redirect permanently
    if (isLegacyRoute(pathname)) {
      const newPath = getLegacyRedirectPath(pathname)
      if (newPath) {
        const url = new URL(newPath, request.url)
        // Preserve query params
        url.search = request.nextUrl.search
        return NextResponse.redirect(url, 301) // Permanent redirect
      }
    }

    // 3. Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // 4. Validate session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session || sessionError) {
      const loginUrl = new URL('/login', request.url)
      
      // Clear all auth cookies on redirect
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'sb-auth-token'
      ]
      
      const redirectResponse = NextResponse.redirect(loginUrl)
      cookiesToClear.forEach(cookieName => {
        redirectResponse.cookies.set(cookieName, '', {
          maxAge: 0,
          path: '/',
        })
      })
      
      return redirectResponse
    }

    // 5. Get employee data and role from user_metadata (with caching)
    let employeeData = getCachedEmployee(session.user.id)
    
    if (!employeeData) {
      // Get role from user_metadata (stored during auth)
      const role = session.user.user_metadata?.role as Role
      
      if (!role) {
        console.error('Role not found in user_metadata')
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'user_not_found')
        
        const redirectResponse = NextResponse.redirect(loginUrl)
        const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
        cookiesToClear.forEach(cookieName => {
          redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
        })
        
        return redirectResponse
      }
      
      // Get employee record to check is_active status
      const { data: employee, error: employeeError } = await supabase
        .from('m_employees')
        .select('is_active')
        .eq('user_id', session.user.id)
        .maybeSingle()
      
      if (employeeError) {
        console.error('Employee fetch error:', employeeError)
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'user_not_found')
        
        const redirectResponse = NextResponse.redirect(loginUrl)
        const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
        cookiesToClear.forEach(cookieName => {
          redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
        })
        
        return redirectResponse
      }
      
      if (!employee) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'user_not_found')
        
        const redirectResponse = NextResponse.redirect(loginUrl)
        const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
        cookiesToClear.forEach(cookieName => {
          redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
        })
        
        return redirectResponse
      }
      
      // Cache the employee data
      setCachedEmployee(session.user.id, role, employee.is_active)
      employeeData = {
        role: role,
        is_active: employee.is_active,
        timestamp: Date.now()
      }
    }
    
    // 6. Check if employee is active
    if (!employeeData.is_active) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'inactive')
      
      const redirectResponse = NextResponse.redirect(loginUrl)
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
      cookiesToClear.forEach(cookieName => {
        redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
      })
      
      return redirectResponse
    }
    
    // 7. Check route authorization
    if (!isRouteAllowed(pathname, employeeData.role)) {
      const forbiddenUrl = new URL('/forbidden', request.url)
      return NextResponse.redirect(forbiddenUrl)
    }
    
    // 8. Set security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    
    // On any error, redirect to login and clear cookies
    const loginUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
    cookiesToClear.forEach(cookieName => {
      redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
    })
    
    return redirectResponse
  }
}

export const config = {
  matcher: [
    // Protected routes
    '/dashboard/:path*',
    '/units/:path*',
    '/users/:path*',
    '/pegawai/:path*',
    '/kpi-config/:path*',
    '/pool/:path*',
    '/realization/:path*',
    '/assessment/:path*',
    '/reports/:path*',
    '/audit/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    // Legacy routes for redirect
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
  ],
}
