'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/lib/services/auth.service'
import { Loader2 } from 'lucide-react'
import { Footer } from '@/components/layout/Footer'

// All authenticated users go to unified dashboard
function getDashboardRoute(): string {
  return '/dashboard'
}

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

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('[LOGIN] Starting login process...')
      const result = await authService.login({ email, password })

      console.log('[LOGIN] Login result:', { success: result.success, hasUser: !!result.user })

      if (result.success && result.user) {
        console.log('[LOGIN] Login successful, redirecting to dashboard...')
        
        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use hard navigation for reliable redirect
        const dashboardUrl = getDashboardRoute()
        console.log('[LOGIN] Redirecting to:', dashboardUrl)
        
        // Force hard redirect with replace to prevent back button issues
        window.location.replace(dashboardUrl)
      } else {
        console.error('[LOGIN] Login failed:', result.error)
        setError(result.error || 'Email atau kata sandi salah')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[LOGIN] Exception during login:', err)
      setError('Terjadi kesalahan, silakan coba lagi')
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
