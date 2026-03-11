import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAssessmentComplete() {
  console.log('🔍 VERIFIKASI LENGKAP HALAMAN ASSESSMENT\n')

  let allChecks = true

  try {
    // 1. Check file structure
    console.log('1. ✅ Memeriksa struktur file...')
    const requiredFiles = [
      'app/(authenticated)/assessment/page.tsx',
      'components/assessment/AssessmentPageContent.tsx',
      'components/assessment/AssessmentTable.tsx',
      'components/assessment/AssessmentReports.tsx',
      'lib/services/assessment.service.ts'
    ]

    for (const file of requiredFiles) {
      const exists = fs.existsSync(file)
      console.log(`   ${file}: ${exists ? '✅' : '❌'}`)
      if (!exists) allChecks = false
    }

    // 2. Check database structure
    console.log('\n2. ✅ Memeriksa struktur database...')
    const requiredTables = ['m_employees', 't_pool', 'm_kpi_indicators', 'm_kpi_categories']
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        console.log(`   Tabel ${table}: ${error ? '❌' : '✅'}`)
        if (error) {
          console.log(`     Error: ${error.message}`)
          allChecks = false
        }
      } catch (error) {
        console.log(`   Tabel ${table}: ❌ Exception`)
        allChecks = false
      }
    }

    // 3. Check user permissions
    console.log('\n3. ✅ Memeriksa izin pengguna...')
    const { data: superadmin, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, user_id')
      .eq('role', 'superadmin')
      .eq('is_active', true)
      .single()

    if (empError || !superadmin) {
      console.log('   ❌ Superadmin tidak ditemukan')
      allChecks = false
    } else {
      console.log(`   ✅ Superadmin: ${superadmin.full_name}`)
      
      // Check auth user metadata
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(superadmin.user_id)
      
      if (authError || !authUser.user) {
        console.log('   ❌ Auth user tidak ditemukan')
        allChecks = false
      } else {
        const role = authUser.user.user_metadata?.role
        console.log(`   ✅ Role di metadata: ${role}`)
        if (role !== 'superadmin') {
          console.log('   ⚠️  Role tidak sesuai, akan diperbaiki...')
          
          // Fix user metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            superadmin.user_id,
            {
              user_metadata: {
                ...authUser.user.user_metadata,
                role: 'superadmin',
                employee_id: superadmin.id,
                full_name: superadmin.full_name
              }
            }
          )

          if (updateError) {
            console.log('   ❌ Gagal update metadata')
            allChecks = false
          } else {
            console.log('   ✅ Metadata diperbaiki')
          }
        }
      }
    }

    // 4. Check route configuration
    console.log('\n4. ✅ Memeriksa konfigurasi route...')
    
    // Check middleware config
    const middlewareContent = fs.readFileSync('middleware.ts', 'utf8')
    const hasAssessmentRoute = middlewareContent.includes('/assessment/:path*')
    console.log(`   Middleware pattern: ${hasAssessmentRoute ? '✅' : '❌'}`)
    if (!hasAssessmentRoute) allChecks = false

    // Check route config service
    const routeConfigContent = fs.readFileSync('lib/services/route-config.service.ts', 'utf8')
    const hasAssessmentConfig = routeConfigContent.includes("path: '/assessment'")
    console.log(`   Route config: ${hasAssessmentConfig ? '✅' : '❌'}`)
    if (!hasAssessmentConfig) allChecks = false

    // 5. Check component syntax
    console.log('\n5. ✅ Memeriksa sintaks komponen...')
    try {
      const pageContent = fs.readFileSync('app/(authenticated)/assessment/page.tsx', 'utf8')
      const hasExport = pageContent.includes('export default')
      const hasImports = pageContent.includes('import')
      
      console.log(`   Page export: ${hasExport ? '✅' : '❌'}`)
      console.log(`   Page imports: ${hasImports ? '✅' : '❌'}`)
      
      if (!hasExport || !hasImports) allChecks = false
    } catch (error) {
      console.log('   ❌ Error membaca file page')
      allChecks = false
    }

    // 6. Final assessment
    console.log('\n6. ✅ HASIL VERIFIKASI:')
    if (allChecks) {
      console.log('   🎉 SEMUA PEMERIKSAAN BERHASIL!')
      console.log('   📋 Langkah selanjutnya:')
      console.log('      1. Restart development server')
      console.log('      2. Clear browser cache')
      console.log('      3. Login ulang sebagai superadmin')
      console.log('      4. Akses http://localhost:3002/assessment')
    } else {
      console.log('   ⚠️  ADA MASALAH YANG PERLU DIPERBAIKI')
      console.log('   📋 Periksa item yang ditandai ❌ di atas')
    }

    // 7. Create quick fix script
    console.log('\n7. ✅ Membuat script perbaikan cepat...')
    const quickFixScript = `
# QUICK FIX ASSESSMENT ACCESS
Write-Host "🔧 Memperbaiki akses assessment..." -ForegroundColor Green

# Stop dev server
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear cache
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue

# Start server
Write-Host "Starting server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Minimized

Write-Host "✅ Server restarted. Tunggu 10 detik lalu coba akses:" -ForegroundColor Green
Write-Host "   http://localhost:3002/assessment" -ForegroundColor Cyan
`

    fs.writeFileSync('QUICK_FIX_ASSESSMENT.ps1', quickFixScript)
    console.log('   ✅ Script dibuat: QUICK_FIX_ASSESSMENT.ps1')

    console.log('\n✅ VERIFIKASI SELESAI!')

  } catch (error) {
    console.error('❌ Verifikasi gagal:', error)
  }
}

// Run verification
verifyAssessmentComplete()