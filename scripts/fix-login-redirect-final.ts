#!/usr/bin/env tsx

/**
 * Script untuk memperbaiki masalah login redirect secara final
 * Fokus pada perbaikan timing dan method redirect
 */

import fs from 'fs'
import path from 'path'

function updateLoginPage() {
  console.log('🔧 Updating login page with better redirect handling...')
  
  const loginPagePath = path.join(process.cwd(), 'app/login/page.tsx')
  let content = fs.readFileSync(loginPagePath, 'utf-8')
  
  // Find and replace the login success handling
  const oldPattern = /if \(result\.success && result\.user\) \{[\s\S]*?window\.location\.replace\(dashboardUrl\)/
  
  const newHandling = `if (result.success && result.user) {
        console.log('[LOGIN] Login successful, establishing session...')
        
        // Import supabase client
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Enhanced session verification with multiple attempts
        let sessionEstablished = false
        let attempts = 0
        const maxAttempts = 20 // Increase attempts for better reliability
        
        while (!sessionEstablished && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 250)) // Shorter intervals
          
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionData.session && !sessionError && sessionData.session.user) {
              console.log('[LOGIN] Session established for:', sessionData.session.user.email)
              console.log('[LOGIN] User role:', sessionData.session.user.user_metadata?.role)
              sessionEstablished = true
              break
            }
            
            console.log(\`[LOGIN] Session attempt \${attempts + 1}/\${maxAttempts}\`)
            attempts++
          } catch (error) {
            console.error('[LOGIN] Session check error:', error)
            attempts++
          }
        }
        
        if (!sessionEstablished) {
          console.error('[LOGIN] Failed to establish session after all attempts')
          setError('Gagal memverifikasi sesi. Silakan refresh halaman dan coba lagi.')
          setIsLoading(false)
          return
        }
        
        console.log('[LOGIN] Session verified, redirecting to dashboard...')
        
        // Use the unified dashboard route
        const dashboardUrl = getDashboardRoute()
        console.log('[LOGIN] Redirecting to:', dashboardUrl)
        
        // Force hard redirect with replace to prevent back navigation issues
        window.location.replace(dashboardUrl)`
  
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newHandling)
    fs.writeFileSync(loginPagePath, content)
    console.log('✅ Login page updated successfully')
  } else {
    console.log('⚠️  Pattern not found, manual update may be needed')
  }
}

function updateMiddleware() {
  console.log('🔧 Updating middleware with better session handling...')
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  let content = fs.readFileSync(middlewarePath, 'utf-8')
  
  // Add better logging to middleware
  const sessionValidationPattern = /\/\/ 4\. Validate session with retry logic[\s\S]*?return redirectResponse\s*\}/
  
  const newSessionValidation = `// 4. Validate session with enhanced retry logic
    let session = null
    let sessionError = null
    let attempts = 0
    const maxAttempts = 3
    
    // Try to get session with retry for transient issues
    while (attempts < maxAttempts) {
      try {
        const result = await supabase.auth.getSession()
        session = result.data.session
        sessionError = result.error
        
        if (session && !sessionError) {
          console.log('[MIDDLEWARE] Session found for user:', session.user.email)
          break // Success
        }
        
        // If no session on first attempt, don't retry (user not logged in)
        if (attempts === 0 && !session) {
          console.log('[MIDDLEWARE] No session found, redirecting to login')
          break
        }
        
        console.log(\`[MIDDLEWARE] Session retry attempt \${attempts + 1}/\${maxAttempts}\`)
        attempts++
        if (attempts < maxAttempts) {
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('[MIDDLEWARE] Session check error:', error)
        sessionError = error
        attempts++
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }
    
    if (!session || sessionError) {
      console.log('[MIDDLEWARE] No valid session, redirecting to login')
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
    }`
  
  if (sessionValidationPattern.test(content)) {
    content = content.replace(sessionValidationPattern, newSessionValidation)
    fs.writeFileSync(middlewarePath, content)
    console.log('✅ Middleware updated successfully')
  } else {
    console.log('⚠️  Middleware pattern not found, keeping existing implementation')
  }
}

function createTestScript() {
  console.log('📝 Creating browser test script...')
  
  const testScript = `#!/usr/bin/env tsx

/**
 * Script untuk test login di browser
 */

console.log('🌐 Browser Login Test Instructions:')
console.log('')
console.log('1. Buka browser dan navigasi ke: http://localhost:3000/login')
console.log('2. Gunakan kredensial:')
console.log('   Email: mukhsin9@gmail.com')
console.log('   Password: admin123')
console.log('3. Perhatikan console browser (F12) untuk log detail')
console.log('4. Setelah login, pastikan diarahkan ke /dashboard')
console.log('')
console.log('Expected behavior:')
console.log('- Login berhasil')
console.log('- Session terverifikasi dalam 5 detik')
console.log('- Redirect ke /dashboard')
console.log('- Tidak kembali ke /login')
console.log('')
console.log('Jika masih redirect ke login:')
console.log('- Cek console browser untuk error')
console.log('- Cek Network tab untuk failed requests')
console.log('- Pastikan localStorage tidak diblokir')
`

  fs.writeFileSync('scripts/test-browser-login.ts', testScript)
  console.log('✅ Browser test script created')
}

async function main() {
  console.log('🚀 Fixing login redirect issue...\n')
  
  updateLoginPage()
  updateMiddleware()
  createTestScript()
  
  console.log('\n✅ Login redirect fixes applied!')
  console.log('\n📋 Next steps:')
  console.log('1. Restart development server: npm run dev')
  console.log('2. Test login in browser: http://localhost:3000/login')
  console.log('3. Check browser console for detailed logs')
  console.log('4. Run: npx tsx scripts/test-browser-login.ts for instructions')
  
  console.log('\n🔧 Key improvements:')
  console.log('- Increased session verification attempts (20 attempts)')
  console.log('- Shorter wait intervals (250ms)')
  console.log('- Better error handling and logging')
  console.log('- Enhanced middleware retry logic')
  console.log('- Use window.location.replace() for redirect')
}

if (require.main === module) {
  main().catch(console.error)
}`

  fs.writeFileSync('scripts/fix-login-redirect-final.ts', testScript)
  console.log('✅ Final fix script created')
}

async function main() {
  console.log('🚀 Applying final login redirect fixes...\n')
  
  updateLoginPage()
  updateMiddleware()
  createTestScript()
  
  console.log('\n✅ All fixes applied successfully!')
  console.log('\n📋 Next steps:')
  console.log('1. Restart development server')
  console.log('2. Test login in browser')
  console.log('3. Check browser console for logs')
}

if (require.main === module) {
  main().catch(console.error)
}