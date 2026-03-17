/**
 * Auth session utilities for handling invalid tokens and session cleanup
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Safely parse JSON string, return null if invalid
 */
function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

/**
 * Clear all auth-related data from browser storage
 */
export function clearAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    // Don't clear if on login page or during login process
    if (window.location.pathname === '/login' || window.location.pathname === '/dashboard') {
      console.log('[AUTH_STORAGE] Skipping storage clear on sensitive page')
      return
    }

    console.log('[AUTH_STORAGE] Clearing auth storage...')
    
    // Clear localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('supabase')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Failed to remove localStorage key:', key)
      }
    })

    // Clear sessionStorage
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.includes('supabase')) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key)
      } catch (error) {
        console.warn('Failed to remove sessionStorage key:', key)
      }
    })

    console.log('[AUTH_STORAGE] Auth storage cleared')
  } catch (error: any) {
    console.error('Error clearing auth storage:', error)
  }
}

/**
 * Validate and fix corrupted session data
 */
export function validateSessionData(): boolean {
  if (typeof window === 'undefined') return true

  try {
    // Check all supabase-related localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('supabase')) {
        const value = localStorage.getItem(key)
        if (value) {
          // Try to parse the value
          const parsed = safeJsonParse(value)
          if (parsed === null && value.startsWith('{')) {
            // Corrupted JSON, remove it
            console.warn('Removing corrupted localStorage item:', key)
            localStorage.removeItem(key)
          }
        }
      }
    }

    // Check sessionStorage as well
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.includes('supabase')) {
        const value = sessionStorage.getItem(key)
        if (value) {
          const parsed = safeJsonParse(value)
          if (parsed === null && value.startsWith('{')) {
            console.warn('Removing corrupted sessionStorage item:', key)
            sessionStorage.removeItem(key)
          }
        }
      }
    }

    return true
  } catch (error: any) {
    console.error('Error validating session data:', error)
    clearAuthStorage()
    return false
  }
}

/**
 * Handle invalid refresh token error
 * Clears storage and redirects to login
 */
export async function handleInvalidRefreshToken() {
  if (typeof window === 'undefined') return

  try {
    const supabase = createClient()
    
    // Sign out to clear server-side session
    await supabase.auth.signOut()
    
    // Clear client-side storage
    clearAuthStorage()
    
    // Redirect to login
    const currentPath = window.location.pathname
    const loginUrl = `/login?redirectTo=${encodeURIComponent(currentPath)}&error=session_expired`
    window.location.href = loginUrl
  } catch (error: any) {
    console.error('Error handling invalid refresh token:', error)
    // Force redirect anyway
    window.location.href = '/login?error=session_expired'
  }
}

/**
 * Setup global error handler for auth errors - MINIMAL VERSION
 * Only handles sign out, no interference with normal auth flow
 */
export function setupAuthErrorHandler() {
  if (typeof window === 'undefined') return

  // Validate session data on startup only
  validateSessionData()

  const supabase = createClient()

  // Only listen for sign out events - don't log or interfere with other events
  supabase.auth.onAuthStateChange((event, session) => {
    // Only handle explicit sign out
    if (event === 'SIGNED_OUT' && !session) {
      if (window.location.pathname !== '/login') {
        clearAuthStorage()
      }
    }
    // Don't log or handle other events to avoid interference
  })
}

/**
 * Verify current session is valid
 */
export async function verifySession(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    // First validate local storage
    if (!validateSessionData()) {
      return false
    }

    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      await handleInvalidRefreshToken()
      return false
    }
    
    return true
  } catch (error: any) {
    console.error('Error verifying session:', error)
    await handleInvalidRefreshToken()
    return false
  }
}
