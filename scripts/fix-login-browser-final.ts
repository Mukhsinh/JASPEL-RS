#!/usr/bin/env tsx

/**
 * Fix Login Browser Issue - Final Solution
 * Memperbaiki masalah login di browser dengan pendekatan yang lebih robust
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

console.log('🔧 Memperbaiki masalah login browser...\n')

// 1. Update login page dengan handling yang lebih baik
const loginPageContent = `'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
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
      console.log('[LOGIN] Starting login process...')
      
      // Clear any corrupted localStorage data
      if (typeof window !== 'undefined') {
        try {
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('sb-')
          )
          keysToRemove.forEach(key => localStorage.removeItem(key))
          console.log('[LOGIN] Cleared localStorage keys:', keysToRemove.length)
        } catch (e) {
          console.warn('[LOGIN] Could not clear localStorage:', e)
        }
      }
      
      // Create fresh client
      const supabase = createClient()
      
      // Clear existing session
      await supabase.auth.signOut({ scope: 'local' })
      
      // Small delay for cleanup
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Perform login
      console.log('[LOGIN] Attempting authentication...')
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

      console.log('[LOGIN] Authentication successful')
      console.log('[LOGIN] User ID:', authData.user.id)
      console.log('[LOGIN] Session token length:', authData.session.access_token.length)
      
      // Wait for session to be stored
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify employee data
      console.log('[LOGIN] Verifying employee data...')
      const { data: employeeData, error: employeeError } = await supabase
        .from('m_employees')
        .select('id, full_name, is_active, role')
        .eq('user_id', authData.user.id)
        .single()
      
      if (employeeError || !employeeData) {
        console.error('[LOGIN] Employee verification failed:', employeeError)
        setError('Data pegawai tidak ditemukan')
        setIsLoading(false)
        return
      }
      
      if (!employeeData.is_active) {
        console.error('[LOGIN] Employee is inactive')
        setError('Akun Anda tidak aktif')
        setIsLoading(false)
        return
      }
      
      console.log('[LOGIN] Employee verified:', employeeData.full_name, '- Role:', employeeData.role)
      
      // Final delay for middleware preparation
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Force redirect with page reload to ensure fresh session
      console.log('[LOGIN] Redirecting to dashboard...')
      window.location.href = getDashboardRoute()
      
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

import { writeFileSync } from 'fs'

// Write updated login page
writeFileSync('app/login/page.tsx', loginPageContent)
console.log('✅ Updated login page with improved session handling')

console.log('\n🎉 Login browser fix completed!')
console.log('\n📋 Changes made:')
console.log('   1. Improved localStorage cleanup')
console.log('   2. Better session verification')
console.log('   3. More robust error handling')
console.log('   4. Force page reload for redirect')
console.log('\n💡 Please test login in browser now')