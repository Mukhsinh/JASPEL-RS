// Test if PDF export routes compile correctly
import { createClient } from '@/lib/supabase/server'

async function testPDFCompilation() {
  console.log('🧪 Testing PDF export compilation...')
  
  try {
    // Test if we can import the route handlers
    const exportRoute = await import('../app/api/kpi-config/export/route')
    const guideRoute = await import('../app/api/kpi-config/guide/route')
    
    console.log('✅ Export route imported successfully')
    console.log('✅ Guide route imported successfully')
    
    // Test if we can create Supabase client
    const supabase = await createClient()
    console.log('✅ Supabase client created successfully')
    
    // Test if we can import jsPDF
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    console.log('✅ jsPDF imported successfully')
    console.log('✅ jsPDF-AutoTable imported successfully')
    
    // Test basic PDF creation
    const doc = new jsPDF()
    doc.text('Test PDF', 20, 20)
    const buffer = Buffer.from(doc.output('arraybuffer'))
    
    console.log(`✅ PDF creation test successful (${buffer.length} bytes)`)
    
    console.log('\n🎉 All compilation tests passed!')
    
  } catch (error) {
    console.error('❌ Compilation test failed:', error)
    process.exit(1)
  }
}

testPDFCompilation()