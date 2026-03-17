#!/usr/bin/env tsx

/**
 * Deployment Readiness Verification Script
 * Checks if the application is ready for Vercel deployment
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

class DeploymentChecker {
  private results: CheckResult[] = []

  private addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) {
    this.results.push({ name, status, message, details })
  }

  // Check if required files exist
  checkRequiredFiles() {
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'vercel.json',
      '.env.local.example',
      'middleware.ts',
      'app/layout.tsx',
      'app/page.tsx'
    ]

    requiredFiles.forEach(file => {
      if (existsSync(file)) {
        this.addResult(`File: ${file}`, 'pass', 'File exists')
      } else {
        this.addResult(`File: ${file}`, 'fail', 'Required file missing')
      }
    })
  }

  // Check package.json configuration
  checkPackageJson() {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
      
      // Check required scripts
      const requiredScripts = ['build', 'start', 'dev']
      requiredScripts.forEach(script => {
        if (packageJson.scripts?.[script]) {
          this.addResult(`Script: ${script}`, 'pass', 'Script defined')
        } else {
          this.addResult(`Script: ${script}`, 'fail', 'Required script missing')
        }
      })

      // Check dependencies
      const criticalDeps = ['next', 'react', '@supabase/supabase-js', 'decimal.js']
      criticalDeps.forEach(dep => {
        if (packageJson.dependencies?.[dep]) {
          this.addResult(`Dependency: ${dep}`, 'pass', `Version: ${packageJson.dependencies[dep]}`)
        } else {
          this.addResult(`Dependency: ${dep}`, 'fail', 'Critical dependency missing')
        }
      })

    } catch (error) {
      this.addResult('Package.json', 'fail', 'Cannot read or parse package.json')
    }
  }

  // Check Next.js configuration
  checkNextConfig() {
    try {
      const nextConfigContent = readFileSync('next.config.js', 'utf-8')
      
      // Check for Vercel optimizations
      if (nextConfigContent.includes('output: \'standalone\'')) {
        this.addResult('Next.js Config', 'pass', 'Standalone output configured')
      } else {
        this.addResult('Next.js Config', 'warning', 'Consider adding standalone output for Vercel')
      }

      if (nextConfigContent.includes('compress: true')) {
        this.addResult('Next.js Compression', 'pass', 'Compression enabled')
      } else {
        this.addResult('Next.js Compression', 'warning', 'Consider enabling compression')
      }

    } catch (error) {
      this.addResult('Next.js Config', 'fail', 'Cannot read next.config.js')
    }
  }

  // Check Vercel configuration
  checkVercelConfig() {
    try {
      const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'))
      
      if (vercelConfig.functions) {
        this.addResult('Vercel Functions', 'pass', 'Function timeouts configured')
      } else {
        this.addResult('Vercel Functions', 'warning', 'No function configuration found')
      }

      if (vercelConfig.headers) {
        this.addResult('Vercel Headers', 'pass', 'Security headers configured')
      } else {
        this.addResult('Vercel Headers', 'warning', 'No security headers configured')
      }

    } catch (error) {
      this.addResult('Vercel Config', 'fail', 'Cannot read or parse vercel.json')
    }
  }

  // Check environment variables
  checkEnvironmentVariables() {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    if (existsSync('.env.local.example')) {
      const envExample = readFileSync('.env.local.example', 'utf-8')
      
      requiredEnvVars.forEach(envVar => {
        if (envExample.includes(envVar)) {
          this.addResult(`Env Var: ${envVar}`, 'pass', 'Documented in .env.local.example')
        } else {
          this.addResult(`Env Var: ${envVar}`, 'fail', 'Missing from .env.local.example')
        }
      })
    } else {
      this.addResult('Environment Variables', 'fail', '.env.local.example not found')
    }
  }

  // Check build size
  checkBuildSize() {
    try {
      // Run build to check for issues
      console.log('Running build check...')
      execSync('npm run build', { stdio: 'pipe' })
      
      // Check .next folder size
      if (existsSync('.next')) {
        const stats = this.getFolderSize('.next')
        const sizeMB = stats / (1024 * 1024)
        
        if (sizeMB < 100) {
          this.addResult('Build Size', 'pass', `Build size: ${sizeMB.toFixed(2)}MB`)
        } else if (sizeMB < 200) {
          this.addResult('Build Size', 'warning', `Build size: ${sizeMB.toFixed(2)}MB (consider optimization)`)
        } else {
          this.addResult('Build Size', 'fail', `Build size: ${sizeMB.toFixed(2)}MB (too large for Vercel free tier)`)
        }
      }

    } catch (error) {
      this.addResult('Build Check', 'fail', 'Build failed', error instanceof Error ? error.message : String(error))
    }
  }

  // Check TypeScript configuration
  checkTypeScript() {
    if (existsSync('tsconfig.json')) {
      try {
        const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'))
        
        if (tsConfig.compilerOptions?.strict) {
          this.addResult('TypeScript Strict', 'pass', 'Strict mode enabled')
        } else {
          this.addResult('TypeScript Strict', 'warning', 'Consider enabling strict mode')
        }

        if (tsConfig.compilerOptions?.skipLibCheck) {
          this.addResult('TypeScript SkipLibCheck', 'pass', 'SkipLibCheck enabled for faster builds')
        } else {
          this.addResult('TypeScript SkipLibCheck', 'warning', 'Consider enabling skipLibCheck')
        }

      } catch (error) {
        this.addResult('TypeScript Config', 'fail', 'Cannot parse tsconfig.json')
      }
    } else {
      this.addResult('TypeScript', 'warning', 'No tsconfig.json found')
    }
  }

  // Check for performance optimizations
  checkPerformanceOptimizations() {
    // Check for lazy loading
    const hasLazyComponents = existsSync('lib/utils/lazy-components.ts')
    this.addResult('Lazy Loading', hasLazyComponents ? 'pass' : 'warning', 
      hasLazyComponents ? 'Lazy loading utilities found' : 'Consider implementing lazy loading')

    // Check for performance monitoring
    const hasPerformanceMonitoring = existsSync('lib/utils/performance-monitor.ts')
    this.addResult('Performance Monitoring', hasPerformanceMonitoring ? 'pass' : 'warning',
      hasPerformanceMonitoring ? 'Performance monitoring implemented' : 'Consider adding performance monitoring')

    // Check middleware optimization
    if (existsSync('middleware.ts')) {
      const middlewareContent = readFileSync('middleware.ts', 'utf-8')
      if (middlewareContent.includes('LRUCache') || middlewareContent.includes('cache')) {
        this.addResult('Middleware Caching', 'pass', 'Caching implemented in middleware')
      } else {
        this.addResult('Middleware Caching', 'warning', 'Consider adding caching to middleware')
      }
    }
  }

  // Helper function to get folder size
  private getFolderSize(folderPath: string): number {
    let totalSize = 0
    
    try {
      const files = require('fs').readdirSync(folderPath)
      
      for (const file of files) {
        const filePath = join(folderPath, file)
        const stats = statSync(filePath)
        
        if (stats.isDirectory()) {
          totalSize += this.getFolderSize(filePath)
        } else {
          totalSize += stats.size
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible files
    }
    
    return totalSize
  }

  // Run all checks
  async runAllChecks() {
    console.log('🔍 Checking deployment readiness...\n')

    this.checkRequiredFiles()
    this.checkPackageJson()
    this.checkNextConfig()
    this.checkVercelConfig()
    this.checkEnvironmentVariables()
    this.checkTypeScript()
    this.checkPerformanceOptimizations()
    this.checkBuildSize()

    this.printResults()
  }

  // Print results
  private printResults() {
    console.log('\n📊 Deployment Readiness Report\n')
    console.log('=' .repeat(50))

    const passed = this.results.filter(r => r.status === 'pass').length
    const warnings = this.results.filter(r => r.status === 'warning').length
    const failed = this.results.filter(r => r.status === 'fail').length

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
      console.log(`${icon} ${result.name}: ${result.message}`)
      if (result.details) {
        console.log(`   Details: ${result.details}`)
      }
    })

    console.log('\n' + '=' .repeat(50))
    console.log(`📈 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`)

    if (failed === 0) {
      console.log('\n🎉 Application is ready for Vercel deployment!')
    } else {
      console.log('\n🚨 Please fix the failed checks before deploying.')
      process.exit(1)
    }
  }
}

// Run the checker
const checker = new DeploymentChecker()
checker.runAllChecks().catch(error => {
  console.error('Error running deployment checks:', error)
  process.exit(1)
})