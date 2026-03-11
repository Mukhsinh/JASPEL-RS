
async function testAssessmentURL() {
  console.log('🌐 Testing Assessment URL Access...\n')

  console.log('1. Manual testing steps:')
  console.log('   - Open browser to http://localhost:3002')
  console.log('   - Login with superadmin account (mukhsin9@gmail.com)')
  console.log('   - Navigate to http://localhost:3002/assessment')
  console.log('   - Check if you get 403 Forbidden or access granted')

  console.log('\n2. Route configuration:')
  console.log('   - Middleware pattern: /assessment/:path*')
  console.log('   - Allowed roles: superadmin, unit_manager')
  console.log('   - Page location: app/(authenticated)/assessment/page.tsx')

  console.log('\n3. If still getting 403 Forbidden:')
  console.log('   a) Check browser dev tools Network tab')
  console.log('   b) Look for middleware redirects')
  console.log('   c) Verify session cookies are present')
  console.log('   d) Check user metadata has correct role')

  console.log('\n4. Quick fixes to try:')
  console.log('   - Clear browser cache and cookies')
  console.log('   - Logout and login again')
  console.log('   - Try incognito/private browsing mode')
  console.log('   - Check if other admin routes work (/dashboard, /units)')

  console.log('\n✅ Manual test guide complete!')
}

// Run the test
testAssessmentURL()