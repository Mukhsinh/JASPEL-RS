import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testBrowserLoginFinal() {
  console.log('🔍 Final browser login test...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Test 1: Backend login verification
  console.log('\n1. Backend login verification...')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Clear any existing session
    await supabase.auth.signOut({ scope: 'global' })
    
    // Test login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Backend login failed:', authError.message)
      return
    }
    
    console.log('✅ Backend login successful')
    
    // Test 2: Employee data verification
    console.log('\n2. Employee data verification...')
    const { data: employee, error: empError } = await supabase
      .from('m_employees')
      .select('id, full_name, role, is_active')
      .eq('user_id', authData.user.id)
      .single()
    
    if (empError || !employee) {
      console.error('❌ Employee data not found:', empError?.message)
      return
    }
    
    if (!employee.is_active) {
      console.error('❌ Employee is not active')
      return
    }
    
    console.log('✅ Employee data verified')
    console.log('- Name:', employee.full_name)
    console.log('- Role:', employee.role)
    
    // Test 3: Generate browser test instructions
    console.log('\n3. Browser test instructions...')
    
    const browserTestSteps = `
🌐 BROWSER TEST STEPS:

1. Open browser and go to: http://localhost:3002/login

2. Clear browser storage (F12 > Application > Storage > Clear All)

3. Enter credentials:
   - Email: mukhsin9@gmail.com
   - Password: admin123

4. Click "Masuk ke Sistem"

5. Expected behavior:
   - Login should succeed
   - Should redirect to /dashboard
   - Then redirect to /units (for superadmin)
   - Should see "Manajemen Unit" page

6. If login fails, check browser console for errors

7. Common issues and solutions:
   - Clear localStorage: localStorage.clear()
   - Clear sessionStorage: sessionStorage.clear()
   - Disable browser extensions
   - Try incognito/private mode

8. Manual test in browser console:
   \`\`\`javascript
   // Clear storage
   localStorage.clear();
   sessionStorage.clear();
   
   // Test login manually
   const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
   const supabase = createClient('${supabaseUrl}', '${supabaseAnonKey}');
   
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'mukhsin9@gmail.com',
     password: 'admin123'
   });
   
   console.log('Login result:', { data, error });
   \`\`\`
`
    
    console.log(browserTestSteps)
    
    // Test 4: Check if dev server is running
    console.log('\n4. Checking dev server status...')
    
    try {
      const response = await fetch('http://localhost:3002/login', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        console.log('✅ Dev server is running at http://localhost:3002')
      } else {
        console.log('⚠️ Dev server responded with status:', response.status)
      }
    } catch (error) {
      console.log('❌ Dev server not accessible. Make sure to run: npm run dev')
    }
    
    console.log('\n✅ All backend tests passed!')
    console.log('🎯 Now test login in browser at: http://localhost:3002/login')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testBrowserLoginFinal().catch(console.error)