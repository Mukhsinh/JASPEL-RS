/**
 * Auth session utilities for handling invalid tokens and session cleanup
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Clear all auth-related data from browser storage
 */
export function clearAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    // Only clear if not on login page
    if (window.location.pathname === '/login') {
      return
    }

    // Clear localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('supabase')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // Clear sessionStorage
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.includes('supabase')) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

    console.log('Auth storage cleared')
  } catch (error: any) {
    console.error('Error clearing auth storage:', error)
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
 * Setup global error handler for auth errors
 */
export function setupAuthErrorHandler() {
  if (typeof window === 'undefined') return

  const supabase = createClient()

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    // Only clear storage on explicit sign out
    if (event === 'SIGNED_OUT' && !session) {
      // Check if we're on login page to avoid clearing during login
      if (window.location.pathname !== '/login') {
        clearAuthStorage()
      }
    }
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully')
    }
    
    // Handle sign in success
    if (event === 'SIGNED_IN' && session) {
      console.log('User signed in successfully')
    }
  })
}

/**
 * Verify current session is valid
 */
export async function verifySession(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
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
