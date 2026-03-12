import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testKPIPDFExport() {
  console.log('🧪 Testing KPI PDF Export functionality...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // 1. Get first active unit
    const { data: units, error: unitsError } = await supabase
      .from('m_units')
      .select('id, code, name')
      .eq('is_active', true)
      .limit(1)
    
    if (unitsError) throw unitsError
    if (!units || units.length === 0) {
      console.log('❌ No active units found')
      return
    }
    
    const unit = units[0]
    console.log(`✅ Found unit: ${unit.code} - ${unit.name}`)
    
    // 2. Check if unit has KPI structure
    const { data: categories, error: catError } = await supabase
      .from('m_kpi_categories')
      .select('*')
      .eq('unit_id', unit.id)
      .eq('is_active', true)
    
    if (catError) throw catError
    
    if (!categories || categories.length === 0) {
      console.log('⚠️ Unit has no KPI categories configured')
      return
    }
    
    console.log(`✅ Found ${categories.length} KPI categories`)
    
    // 3. Test PDF export endpoint
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const exportUrl = `${baseUrl}/api/kpi-config/export?unitId=${unit.id}&format=pdf`
    
    console.log(`🔗 Testing PDF export: ${exportUrl}`)
    
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ PDF export failed:', response.status, errorText)
      return
    }
    
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    
    console.log(`✅ PDF export successful:`)
    console.log(`   Content-Type: ${contentType}`)
    console.log(`   Content-Length: ${contentLength} bytes`)
    
    // 4. Test guide PDF export
    const guideUrl = `${baseUrl}/api/kpi-config/guide`
    console.log(`🔗 Testing Guide PDF export: ${guideUrl}`)
    
    const guideResponse = await fetch(guideUrl, {
      method: 'GET'
    })
    
    if (!guideResponse.ok) {
      const errorText = await guideResponse.text()
      console.log('❌ Guide PDF export failed:', guideResponse.status, errorText)
      return
    }
    
    const guideContentType = guideResponse.headers.get('content-type')
    const guideContentLength = guideResponse.headers.get('content-length')
    
    console.log(`✅ Guide PDF export successful:`)
    console.log(`   Content-Type: ${guideContentType}`)
    console.log(`   Content-Length: ${guideContentLength} bytes`)
    
    // 5. Check settings for cover page info
    const { data: settings, error: settingsError } = await supabase
      .from('t_settings')
      .select('key, value')
      .in('key', ['company_info', 'footer'])
    
    if (settingsError) {
      console.log('⚠️ Could not fetch settings:', settingsError.message)
    } else {
      const companyInfo = settings?.find(s => s.key === 'company_info')?.value || {}
      const footerInfo = settings?.find(s => s.key === 'footer')?.value || {}
      
      console.log('📋 Settings for PDF:')
      console.log(`   App Name: ${companyInfo.appName || 'Not set'}`)
      console.log(`   Developer Name: ${companyInfo.developerName || 'Not set'}`)
      console.log(`   Organization: ${companyInfo.name || 'Not set'}`)
      console.log(`   Footer Text: ${typeof footerInfo === 'string' ? footerInfo : (footerInfo.text || 'Not set')}`)
    }
    
    console.log('\n🎉 All PDF export tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testKPIPDFExport()