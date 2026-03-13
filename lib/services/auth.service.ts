import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { handleAuthError, logAuthError } from '@/lib/utils/auth-errors'
import type { UserWithEmployee, UserMetadata } from '@/lib/types/database.types'
import { clearAllStorage } from '@/lib/utils/storage-adapter'

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserData {
  id: string
  email: string
  role: string
  unit_id: string | null
  is_active: boolean
  full_name: string
}

export interface LoginResult {
  success: boolean
  user?: UserData
  error?: string
}

export type UserRole = 'superadmin' | 'unit_manager' | 'employee'

class AuthService {
  async signIn(email: string, password: string): Promise<LoginResult> {
    try {
      // Skip if running on server
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Login hanya dapat dilakukan di browser',
        }
      }

      const supabase = createClient()
      
      console.log('[AUTH] Starting sign in for:', email)
      
      // Clear any existing session first
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (clearError) {
        console.warn('[AUTH] Error clearing session:', clearError)
      }

      // Add timeout to prevent hanging
      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )
      
      const { data: authData, error: authError } = await Promise.race([signInPromise, timeoutPromise]) as any

      if (authError || !authData.user) {
        console.error('[AUTH] Sign in failed:', authError)
        logAuthError('signIn', authError)
        return {
          success: false,
          error: handleAuthError(authError),
        }
      }

      console.log('[AUTH] Sign in successful, user ID:', authData.user.id)

      // Check both user_metadata and raw_user_meta_data for role
      const role = (authData.user.user_metadata?.role || authData.user.raw_user_meta_data?.role) as string
      
      if (!role) {
        console.error('[AUTH] Role not found in metadata')
        console.error('[AUTH] user_metadata:', authData.user.user_metadata)
        console.error('[AUTH] raw_user_meta_data:', authData.user.raw_user_meta_data)
        logAuthError('user-fetch', new Error('Role not found in user metadata'))
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Data pengguna tidak ditemukan',
        }
      }

      console.log('[AUTH] User role:', role)
      console.log('[AUTH] Fetching employee data...')

      // Try to fetch employee data with retry logic
      let employeeData = null
      let employeeError = null
      
      for (let attempt = 0; attempt < 3; attempt++) {
        // Use maybeSingle() to avoid PGRST116 error
        const result = await supabase
          .from('m_employees')
          .select('id, full_name, unit_id, is_active')
          .eq('user_id', authData.user.id)
          .limit(1)
          .maybeSingle()
        
        employeeData = result.data
        employeeError = result.error
        
        if (employeeData) break
        
        if (attempt < 2) {
          console.warn(`[AUTH] Employee fetch attempt ${attempt + 1} failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      if (employeeError) {
        console.error('[AUTH] Employee fetch error after retries:', employeeError)
        logAuthError('employee-fetch', employeeError)
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Gagal mengambil data pegawai',
        }
      }

      if (!employeeData) {
        console.error('[AUTH] Employee not found for user:', authData.user.id)
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Data pegawai tidak ditemukan',
        }
      }

      console.log('[AUTH] Employee data found:', {
        id: employeeData.id,
        name: employeeData.full_name,
        active: employeeData.is_active,
      })

      if (!employeeData.is_active) {
        console.warn('[AUTH] Employee is inactive')
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Akun Anda tidak aktif',
        }
      }

      const userDataResult: UserData = {
        id: authData.user.id,
        email: authData.user.email || '',
        role: role as UserRole,
        unit_id: employeeData.unit_id,
        is_active: employeeData.is_active,
        full_name: employeeData.full_name,
      }

      console.log('[AUTH] Login successful for:', userDataResult.full_name)

      return {
        success: true,
        user: userDataResult,
      }
    } catch (error: any) {
      console.error('[AUTH] Exception during sign in:', error)
      
      // Handle specific storage errors
      if (error?.message?.includes('Cannot read properties of undefined') ||
          error?.message?.includes('removeItem') ||
          error?.message?.includes('getItem')) {
        console.warn('[AUTH] Storage error detected, clearing and retrying...')
        
        // Clear storage and try to recover
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (storageError) {
          console.warn('[AUTH] Could not clear storage:', storageError)
        }
        
        return {
          success: false,
          error: 'Terjadi masalah dengan penyimpanan browser. Silakan refresh halaman dan coba lagi.',
        }
      }
      
      logAuthError('signIn-exception', error)
      return {
        success: false,
        error: 'Terjadi kesalahan, silakan coba lagi',
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    return this.signIn(credentials.email, credentials.password)
  }

  async signOut(): Promise<void> {
    try {
      const supabase = createClient()
      
      console.log('[AUTH] Starting sign out...')
      
      // Sign out from Supabase with scope 'global' to remove all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('[AUTH] Sign out error:', error)
        logAuthError('signOut', error)
      }
      
      // Clear all storage using safe adapter
      if (typeof window !== 'undefined') {
        // Use safe storage adapter
        clearAllStorage()
        
        // Clear all Supabase-related cookies
        const cookiesToClear = [
          'sb-access-token',
          'sb-refresh-token',
          'supabase-auth-token',
          'sb-auth-token'
        ]
        
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        })
        
        // Clear all cookies as fallback
        document.cookie.split(";").forEach((c) => {
          const cookieName = c.split("=")[0].trim()
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        })
        
        console.log('[AUTH] Sign out completed, storage and cookies cleared')
        
        // Small delay to ensure cookies are cleared before redirect
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Force hard redirect to ensure middleware picks up cleared session
        window.location.replace('/login')
      }
    } catch (error) {
      console.error('[AUTH] Exception during sign out:', error)
      logAuthError('signOut-exception', error)
      
      // Still clear storage and redirect even if sign out fails
      if (typeof window !== 'undefined') {
        clearAllStorage()
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          const cookieName = c.split("=")[0].trim()
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })
        
        window.location.replace('/login')
      }
    }
  }

  async logout(): Promise<void> {
    return this.signOut()
  }

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return null
      }

      const role = session.user.user_metadata?.role as string
      
      if (!role) {
        return null
      }

      const { data: employeeData, error } = await supabase
        .from('m_employees')
        .select('id, full_name, unit_id, is_active')
        .eq('user_id', session.user.id)
        .single()

      if (error || !employeeData) {
        return null
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        role: role as UserRole,
        unit_id: employeeData.unit_id,
        is_active: employeeData.is_active,
        full_name: employeeData.full_name,
      }
    } catch (error) {
      logAuthError('getCurrentUser', error)
      return null
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      logAuthError('isAuthenticated', error)
      return false
    }
  }

  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || user.id !== userId) {
        return null
      }

      const metadata = user.user_metadata as UserMetadata
      return metadata.role as UserRole
    } catch (error) {
      logAuthError('getUserRole', error)
      return null
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      logAuthError('getSession', error)
      return null
    }
  }

  async getCurrentUserWithEmployee(): Promise<UserWithEmployee | null> {
    try {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return null
      }

      const role = session.user.user_metadata?.role as string
      
      if (!role) {
        return null
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from('m_employees')
        .select('id, employee_code, full_name, unit_id, tax_status, is_active, created_at, updated_at')
        .eq('user_id', session.user.id)
        .single()

      if (employeeError || !employeeData) {
        return null
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        role: role as UserRole,
        employeeId: employeeData.id,
        employeeCode: employeeData.employee_code,
        fullName: employeeData.full_name,
        unitId: employeeData.unit_id,
        taxStatus: employeeData.tax_status,
        isActive: employeeData.is_active,
        createdAt: employeeData.created_at,
        updatedAt: employeeData.updated_at,
      }
    } catch (error) {
      logAuthError('getCurrentUserWithEmployee', error)
      return null
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        logAuthError('resetPassword', error)
        return {
          success: false,
          error: handleAuthError(error),
        }
      }

      return { success: true }
    } catch (error) {
      logAuthError('resetPassword-exception', error)
      return {
        success: false,
        error: 'Terjadi kesalahan, silakan coba lagi',
      }
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        logAuthError('updatePassword', error)
        return {
          success: false,
          error: handleAuthError(error),
        }
      }

      return { success: true }
    } catch (error) {
      logAuthError('updatePassword-exception', error)
      return {
        success: false,
        error: 'Terjadi kesalahan, silakan coba lagi',
      }
    }
  }
}

export const authService = new AuthService()
