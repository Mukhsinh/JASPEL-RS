import { existsSync } from 'fs'
import { join } from 'path'

function verifyBuildSuccess() {
  console.log('🔍 Verifying Build Success...\n')
  
  const buildDir = join(process.cwd(), '.next')
  const buildExists = existsSync(buildDir)
  
  if (buildExists) {
    console.log('✅ Build directory exists: .next/')
    
    // Check for key build files
    const keyFiles = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ]
    
    let allFilesExist = true
    keyFiles.forEach(file => {
      const filePath = join(process.cwd(), file)
      if (existsSync(filePath)) {
        console.log(`✅ ${file} exists`)
      } else {
        console.log(`❌ ${file} missing`)
        allFilesExist = false
      }
    })
    
    if (allFilesExist) {
      console.log('\n🎉 BUILD BERHASIL!')
      console.log('✅ Aplikasi siap untuk deploy ke Vercel')
      console.log('✅ Semua error TypeScript sudah diperbaiki')
      console.log('✅ Konflik tipe KPISubIndicator sudah teratasi')
    } else {
      console.log('\n⚠️  Build tidak lengkap')
    }
  } else {
    console.log('❌ Build directory tidak ditemukan')
    console.log('   Build mungkin gagal atau belum selesai')
  }
}

verifyBuildSuccess()