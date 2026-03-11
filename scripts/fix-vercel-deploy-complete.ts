import { execSync } from 'child_process'

console.log('🔧 Memperbaiki Error Deploy Vercel...\n')

try {
  console.log('1. ✅ Checking TypeScript compilation...')
  
  // Test TypeScript compilation only (faster than full build)
  execSync('npx tsc --noEmit', { stdio: 'pipe' })
  console.log('   ✅ TypeScript compilation successful')
  
  console.log('\n2. ✅ Testing Next.js build...')
  
  // Try build with timeout
  const buildResult = execSync('npm run build', { 
    stdio: 'pipe', 
    timeout: 45000,
    encoding: 'utf8'
  })
  
  console.log('   ✅ Build successful!')
  
  console.log('\n🎉 PERBAIKAN BERHASIL!')
  console.log('✅ Error TypeScript sudah diperbaiki')
  console.log('✅ Build Next.js berhasil')
  console.log('✅ Siap deploy ke Vercel')
  
  console.log('\n📝 Langkah selanjutnya:')
  console.log('1. Commit dan push ke GitHub')
  console.log('2. Vercel akan otomatis deploy')
  console.log('3. Monitor deployment di dashboard Vercel')
  
} catch (error: any) {
  console.error('❌ Error:', error.message)
  
  if (error.stdout) {
    console.log('\n📋 Build Output:')
    console.log(error.stdout.toString())
  }
  
  if (error.stderr) {
    console.log('\n🚨 Error Details:')
    console.log(error.stderr.toString())
  }
  
  console.log('\n🔧 Masalah yang mungkin terjadi:')
  console.log('- TypeScript type conflicts')
  console.log('- Missing imports atau exports')
  console.log('- Syntax errors di components')
  
  process.exit(1)
}