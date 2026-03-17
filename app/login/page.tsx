'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Loader2, RefreshCw } from 'lucide-react'
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
  const [showClearStorage, setShowClearStorage] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
    
    // Check if there's a stuck session
    checkStuckSession()
  }, [searchParams])
  
  const checkStuckSession = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('[LOGIN] Found existing session, clearing...')
        await supabase.auth.signOut({ scope: 'local' })
        
        // Clear all storage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.warn('[LOGIN] Could not clear storage:', e)
        }
      }
    } catch (e) {
      console.warn('[LOGIN] Error checking session:', e)
    }
  }
  
  const handleClearStorage = () => {
    try {
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.split("=")[0].trim()
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      })
      
      setError(null)
      setShowClearStorage(false)
      alert('Storage berhasil dibersihkan. Silakan coba login lagi.')
      
      // Reload page
      window.location.reload()
    } catch (e) {
      console.error('[LOGIN] Error clearing storage:', e)
      alert('Gagal membersihkan storage. Silakan coba manual di DevTools.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('[LOGIN] Starting login process...')
      
      const supabase = createClient()
      
      // Clear any existing session first
      try {
        await supabase.auth.signOut({ scope: 'local' })
        console.log('[LOGIN] Cleared existing session')
      } catch (clearError) {
        console.warn('[LOGIN] Could not clear session:', clearError)
      }
      
      // Small delay to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('[LOGIN] Attempting sign in...')
      
      // Login with credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      if (authError) {
        console.error('[LOGIN] Auth error:', authError)
        setError(authError.message || 'Email atau kata sandi salah')
        setShowClearStorage(true) // Show clear storage button on error
        setIsLoading(false)
        return
      }

      if (!authData.user || !authData.session) {
        console.error('[LOGIN] No user or session returned')
        setError('Gagal membuat sesi, silakan coba lagi')
        setIsLoading(false)
        return
      }

      console.log('[LOGIN] Login successful!')
      console.log('[LOGIN] User:', authData.user.email)
      console.log('[LOGIN] Role:', authData.user.user_metadata?.role)
      console.log('[LOGIN] Session expires:', new Date(authData.session.expires_at! * 1000).toLocaleString())
      
      // Wait a bit for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Redirect using window.location for full page reload
      // This ensures middleware runs and cookies are properly set
      console.log('[LOGIN] Redirecting to dashboard...')
      window.location.href = '/dashboard'
      
    } catch (err: any) {
      console.error('[LOGIN] Exception:', err)
      
      // Check for specific errors
      if (err?.message?.includes('storage') || err?.message?.includes('localStorage')) {
        setError('Terjadi masalah dengan penyimpanan browser. Silakan refresh halaman dan coba lagi.')
        setShowClearStorage(true)
      } else {
        setError('Terjadi kesalahan sistem, silakan coba lagi')
        setShowClearStorage(true)
      }
      
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
                <div className="space-y-2">
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                  {showClearStorage && (
                    <Button
                      type="button"
                      onClick={handleClearStorage}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Bersihkan Storage & Coba Lagi
                    </Button>
                  )}
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
