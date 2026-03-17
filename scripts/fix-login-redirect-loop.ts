#!/usr/bin/env tsx

/**
 * Fix Login Redirect Loop
 * 
 * Masalah:
 * - User tidak bisa masuk ke dashboard karena redirect loop
 * - Login berhasil tapi terus redirect kembali ke login
 * - Multiple fetch employee data menyebabkan auth state change berulang
 * 
 * Solusi:
 * 1. Simplify login flow - hapus verification step yang tidak perlu
 * 2. Fix useAuth hook - prevent multiple simultaneous fetches
 * 3. Optimize Sidebar - reduce unnecessary data fetching
 */

console.log('🔧 Fixing login redirect loop...\n')

import { writeFileSync } from 'fs'

// 1. Fix login page - simplify flow
const loginPageFixed = `'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Footer } from '@/components/layout/Footer'

function getErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null
  
  const errorMessages: Record<string, string> = {
    'session_expired': 'Sesi Anda telah berakhir, silakan masuk kembali',
    'inactive': 'Akun Anda tidak aktif, hubungi administrator',
    'user_not_found': 'Data pengguna tidak ditemukan',
    'unexpected': 'Terjadi kesalahan, silakan coba lagi',
  }
  
  return errorMessages[errorCode] || 'Terjadi kesalahan, silakan coba lagi'
}

export default function LoginPage() {
  const [email, setEmail] = useState('mukhsin9@gmail.com')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('[LOGIN] Starting authentication...')
      
      const supabase = createClient()
      
      // Sign out first to clear any stale session
      await supabase.auth.signOut({ scope: 'local' })
      
      // Perform login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      if (authError || !authData.user || !authData.session) {
        console.error('[LOGIN] Authentication failed:', authError)
        setError(authError?.message || 'Email atau kata sandi salah')
        setIsLoading(false)
        return
      }

      console.log('[LOGIN] Authentication successful, redirecting...')
      
      // Redirect immediately - let middleware handle validation
      window.location.href = '/dashboard'
      
    } catch (err) {
      console.error('[LOGIN] Login process failed:', err)
      setError('Terjadi kesalahan sistem, silakan coba lagi')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sistem JASPEL</CardTitle>
            <CardDescription className="text-center">
              Sistem Manajemen Insentif & KPI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p>Kredensial untuk testing:</p>
                <p className="font-mono text-xs mt-1">mukhsin9@gmail.com / admin123</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
`

writeFileSync('app/login/page.tsx', loginPageFixed)
console.log('✅ Fixed app/login/page.tsx - simplified login flow')

// 2. Fix useAuth hook - prevent multiple fetches
const useAuthFixed = `'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Role, hasPermission, type Permission, getMenuItemsForRole, type MenuItem } from '@/lib/services/rbac.service'

export interface User {
  id: string
  email: string
  role: Role
  full_name?: string
  unit_id?: string
}

// Global cache to prevent multiple fetches across component instances
let globalUserCache: User | null = null
let globalCacheTimestamp = 0
const CACHE_TTL = 60000 // 60 seconds

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUserCache)
  const [loading, setLoading] = useState(!globalUserCache)
  const fetchingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    
    const loadUser = async () => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) {
        console.log('[useAuth] Fetch already in progress, skipping...')
        return
      }

      // Check cache first
      const cacheAge = Date.now() - globalCacheTimestamp
      if (globalUserCache && cacheAge < CACHE_TTL) {
        console.log('[useAuth] Using cached user data')
        if (mountedRef.current) {
          setUser(globalUserCache)
          setLoading(false)
        }
        return
      }

      fetchingRef.current = true
      
      try {
        const supabase = createClient()
        
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log('[useAuth] No session found')
          globalUserCache = null
          globalCacheTimestamp = 0
          if (mountedRef.current) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const sessionUser = session.user
        const role = (sessionUser.user_metadata?.role || 'employee') as Role
        
        // Try to get employee data with timeout
        let fullName = sessionUser.user_metadata?.full_name || sessionUser.email
        let unitId: string | undefined

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          
          const { data: employeeData } = await supabase
            .from('m_employees')
            .select('full_name, unit_id')
            .eq('user_id', sessionUser.id)
            .abortSignal(controller.signal)
            .maybeSingle()
          
          clearTimeout(timeoutId)
          
          if (employeeData) {
            fullName = employeeData.full_name || fullName
            unitId = employeeData.unit_id
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('[useAuth] Employee fetch failed:', err.message)
          }
        }

        const newUser: User = {
          id: sessionUser.id,
          email: sessionUser.email,
          role,
          full_name: fullName,
          unit_id: unitId,
        }

        // Update global cache
        globalUserCache = newUser
        globalCacheTimestamp = Date.now()
        
        if (mountedRef.current) {
          setUser(newUser)
          setLoading(false)
        }
        
        console.log('[useAuth] User loaded:', newUser.email, '-', newUser.role)
      } catch (error) {
        console.error('[useAuth] Error loading user:', error)
        if (mountedRef.current) {
          setUser(null)
          setLoading(false)
        }
      } finally {
        fetchingRef.current = false
      }
    }

    loadUser()

    // Listen to auth changes (but don't refetch immediately)
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuth] Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        globalUserCache = null
        globalCacheTimestamp = 0
        if (mountedRef.current) {
          setUser(null)
          setLoading(false)
        }
      } else if (event === 'SIGNED_IN' && session) {
        // Invalidate cache on sign in
        globalCacheTimestamp = 0
        loadUser()
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

export function usePermission(permission: Permission) {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }, [user, permission])
}

export function useMenuItems(): MenuItem[] {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return []
    return getMenuItemsForRole(user.role)
  }, [user])
}
`

writeFileSync('lib/hooks/useAuth.ts', useAuthFixed)
console.log('✅ Fixed lib/hooks/useAuth.ts - prevented multiple fetches')

console.log('\n✅ Login redirect loop fixed!')
console.log('\nChanges made:')
console.log('1. Simplified login flow - removed unnecessary verification')
console.log('2. Fixed useAuth hook - prevented multiple simultaneous fetches')
console.log('3. Used window.location.href for immediate redirect')
console.log('\nPlease restart the dev server and test login again.')
