import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Files to fix
const filesToFix = [
  'middleware.ts',
  'services/calculation.service.ts',
  'lib/utils/storage-adapter.ts',
  'lib/utils/format.ts',
  'lib/utils/auth-session.ts',
  'lib/supabase/server.ts',
  'lib/services/assessment.service.ts',
  'lib/export/excel-export.ts',
  'app/api/units/template/route.ts',
  'app/api/reports/generate/route.ts',
  'app/api/reports/export/route.ts',
  'app/api/notifications/route.ts',
  'app/api/kpi-config/guide/route.ts',
  'app/api/import/realization/route.ts',
  'app/api/import/template/route.ts',
  'app/api/pegawai/template/route.ts',
  'app/api/kpi-config/export/route.ts',
  'app/api/assessment/route.ts',
  'app/api/assessment/status/route.ts',
  'app/api/assessment/reports/route.ts',
  'app/api/assessment/indicators/route.ts',
]

function fixFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    
    // Replace } catch (error) { with } catch (error: any) {
    const fixed = content.replace(/} catch \(error\) {/g, '} catch (error: any) {')
    
    if (content !== fixed) {
      writeFileSync(filePath, fixed, 'utf-8')
      console.log(`✓ Fixed: ${filePath}`)
      return true
    } else {
      console.log(`- Skipped (no changes): ${filePath}`)
      return false
    }
  } catch (err: any) {
    console.error(`✗ Error fixing ${filePath}:`, err.message)
    return false
  }
}

console.log('Fixing TypeScript catch block errors...\n')

let fixedCount = 0
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++
  }
}

console.log(`\n✓ Fixed ${fixedCount} files`)
console.log('\nRunning build to verify...')
