import { existsSync, statSync } from 'fs'
import { join } from 'path'

console.log('Verifying build output...\n')

const checks = [
  { path: '.next', type: 'dir', name: 'Build directory' },
  { path: '.next/server', type: 'dir', name: 'Server directory' },
  { path: '.next/static', type: 'dir', name: 'Static directory' },
  { path: '.next/standalone', type: 'dir', name: 'Standalone build', optional: true },
]

let allPassed = true

for (const check of checks) {
  const exists = existsSync(check.path)
  
  if (!exists && check.optional) {
    console.log(`⚠ ${check.name}: Not found (optional)`)
    continue
  }
  
  if (!exists) {
    console.log(`✗ ${check.name}: NOT FOUND`)
    allPassed = false
    continue
  }
  
  const stats = statSync(check.path)
  const isCorrectType = check.type === 'dir' ? stats.isDirectory() : stats.isFile()
  
  if (!isCorrectType) {
    console.log(`✗ ${check.name}: Wrong type`)
    allPassed = false
    continue
  }
  
  console.log(`✓ ${check.name}: OK`)
}

console.log('\n' + '='.repeat(50))
if (allPassed) {
  console.log('✓ Build verification PASSED')
  console.log('\nReady to deploy to Vercel!')
  console.log('\nNext steps:')
  console.log('1. Commit changes: git add . && git commit -m "Fix build errors"')
  console.log('2. Push to GitHub: git push')
  console.log('3. Deploy to Vercel (automatic or manual)')
} else {
  console.log('✗ Build verification FAILED')
  process.exit(1)
}
