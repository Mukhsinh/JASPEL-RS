'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Settings, getSettings, updateSettings as updateSettingsService } from '@/lib/services/settings.service'
import { createClient } from '@/lib/supabase/client'

interface SettingsContextValue {
  settings: Settings | null
  loading: boolean
  error: string | null
  updateSettings: (settings: Partial<Settings>) => Promise<{ success: boolean; error: string | null }>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

// In-memory cache
let settingsCache: Settings | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60000 // 1 minute

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(settingsCache)
  const [loading, setLoading] = useState(!settingsCache)
  const [error, setError] = useState<string | null>(null)

  // Load settings dengan caching
  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache
      if (!forceRefresh && settingsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
        setSettings(settingsCache)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await getSettings()

      if (fetchError) {
        // Don't throw error, just log it and set default settings
        console.warn('Failed to load settings:', fetchError)
        setError(null) // Don't show error to user
        setLoading(false)
        return
      }

      if (data) {
        settingsCache = data
        cacheTimestamp = Date.now()
        setSettings(data)
        setError(null)
      }
    } catch (err: any) {
      console.warn('Failed to load settings:', err)
      // Don't show error to user, just use defaults
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      setLoading(true)
      setError(null)

      const result = await updateSettingsService(newSettings)

      if (result.success) {
        // Invalidate cache
        settingsCache = null
        cacheTimestamp = 0
        await loadSettings(true)
        return { success: true, error: null }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memperbarui pengaturan'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadSettings])

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    settingsCache = null
    cacheTimestamp = 0
    await loadSettings(true)
  }, [loadSettings])

  // Initial load - only if user is authenticated
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // Skip if running on server
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const supabase = createClient()
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

        // Only load settings if user is authenticated
        if (session) {
          await loadSettings()
        } else {
          setLoading(false)
        }
      } catch (err: any) {
        // Silently handle various auth errors
        if (err?.name === 'AbortError' || 
            err?.message?.includes('Lock broken') ||
            err?.message?.includes('Session timeout') ||
            err?.message?.includes('Cannot read properties of undefined')) {
          console.warn('[Settings] Auth error, retrying in 2s...', err.message)
          setTimeout(() => checkAuthAndLoad(), 2000)
          return
        }
        console.warn('Settings context init error:', err)
        setLoading(false)
      }
    }

    // Delay to prevent hydration issues and allow storage to initialize
    const timer = setTimeout(() => {
      checkAuthAndLoad()
    }, 100)

    return () => clearTimeout(timer)
  }, [loadSettings])

  // Subscribe to real-time changes - only if authenticated
  useEffect(() => {
    const supabase = createClient()

    const setupSubscription = async () => {
      try {
        // Skip if running on server
        if (typeof window === 'undefined') return

        // Add timeout for session check
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        )
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

        // Only subscribe if user is authenticated
        if (!session) return

        const channel = supabase
          .channel('settings-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 't_settings'
            },
            () => {
              settingsCache = null
              cacheTimestamp = 0
              loadSettings(true)
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } catch (err) {
        // Silently handle subscription errors
        if (err?.message?.includes('Session timeout') || 
            err?.message?.includes('Cannot read properties of undefined')) {
          console.warn('[Settings] Subscription setup failed, continuing without realtime updates')
          return
        }
        console.warn('Settings subscription error:', err)
      }
    }

    setupSubscription()
  }, [loadSettings])

  const value: SettingsContextValue = {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

// Hook untuk menggunakan settings context
export function useSettings() {
  const context = useContext(SettingsContext)

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }

  return context
}
