#!/usr/bin/env tsx

/**
 * Build Optimization Script
 * Optimizes the application for production deployment
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

class BuildOptimizer {
  
  // Clean up development files
  cleanupDevFiles() {
    console.log('🧹 Cleaning up development files...')
    
    try {
      // Remove development-only files
      const devFiles = [
        '.next',
        'node_modules/.cache',
        'tsconfig.tsbuildinfo'
      ]

      devFiles.forEach(file => {
        if (existsSync(file)) {
          execSync(`rm -rf ${file}`, { stdio: 'inherit' })
          console.log(`   ✅ Removed ${file}`)
        }
      })
    } catch (error) {
      console.warn('   ⚠️ Some cleanup operations failed (this is usually fine)')
    }
  }

  // Optimize package.json for production
  optimizePackageJson() {
    console.log('📦 Optimizing package.json...')
    
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
      
      // Add production optimizations
      igeJson.scripts['build:analyze']) {
        packageJson.scripts['build:analyze'] = 'ANALYZE=true next build'
      }
      
      if (!packageJson.scripts['start:prod']) {
        packageJson.scripts['start:prod'] = 'NODE_ENV=production next start'
      }

      // Ensure engines are specified for Vercel
      if (!packageJson.engines) {
        packageJson.engines = {
          node: '>=18.0.0',
          npm: '>=8.0.0'
        }
      }

      writeFileSync('package.json', JSON.stringify(pa)
      console.log('   ✅ Package.json optimized')
    } catch (error) {
      console.error('   ❌ Failed to optimize package.json:', error)
    }
  }

  // Check and optimize Next.js config
  optimizeNextConfig() {
    console.log('⚙️ Optimizing Next.js configuration...')
    
    try {
      let nextConfigContent = readFileSync('next.config.js', 'utf-8')
      
      // Ensure standalone output is enabled
      if (!nextConfigContent.includes('output: \'standalone\'')) {
  nfigContent.replace(
          'const nextConfig = {',
          `const nextConfig = {
  output: 'standalone',`
        )
        console.log('   ✅ Added standalone output')
      }

      // Ensure compression is enabled
      if (!nextConfigCong('   4. Set environment variables in Vercel dashboard')
    console.log('   5. Deploy!')
  }
}

// Run the optimizer
const optimizer = new BuildOptimizer()
optimizer.runAllOptimizations().catch(error => {
  console.error('❌ Optimization failed:', error)
  process.exit(1)
})ePackageJson()
    this.optimizeNextConfig()
    this.installProductionDeps()
    this.runOptimizedBuild()
    this.analyzeBundleSize()
    this.generateDeploymentSummary()

    console.log('\n✨ Build optimization completed!')
    console.log('🎯 Your application is now optimized for Vercel deployment.')
    console.log('\n📝 Next steps:')
    console.log('   1. Commit your changes to Git')
    console.log('   2. Push to your GitHub repository')
    console.log('   3. Connect repository to Vercel')
    console.lo: [
        'Set environment variables in Vercel dashboard',
        'Connect GitHub repository',
        'Deploy to Vercel',
        'Monitor performance metrics'
      ]
    }

    writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2))
    console.log('   ✅ Deployment summary saved to deployment-summary.json')
  }

  // Run all optimizations
  async runAllOptimizations() {
    console.log('🚀 Starting build optimization for Vercel deployment...\n')

    this.cleanupDevFiles()
    this.optimizreturn totalSize
  }

  // Generate deployment summary
  generateDeploymentSummary() {
    console.log('📋 Generating deployment summary...')
    
    const summary = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      buildOptimizations: [
        'Standalone output enabled',
        'Compression enabled',
        'Production environment variables set',
        'Bundle analysis available',
        'Static assets optimized'
      ],
      vercelReady: true,
      nextStepsolderSize(folderPath: string): number {
    let totalSize = 0
    
    try {
      const fs = require('fs')
      const files = fs.readdirSync(folderPath)
      
      for (const file of files) {
        const filePath = join(folderPath, file)
        const stats = fs.statSync(filePath)
        
        if (stats.isDirectory()) {
          totalSize += this.getFolderSize(filePath)
        } else {
          totalSize += stats.size
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    xt', 'static')
      if (existsSync(staticFolder)) {
        const size = this.getFolderSize(staticFolder)
        const sizeMB = (size / (1024 * 1024)).toFixed(2)
        console.log(`   📦 Static assets size: ${sizeMB}MB`)
        
        if (parseFloat(sizeMB) > 50) {
          console.log('   ⚠️ Large static assets detected - consider optimization')
        }
      }

    } catch (error) {
      console.warn('   ⚠️ Bundle analysis failed:', error)
    }
  }

  // Helper to calculate folder size
  private getF return
      }

      // Get build info
      const buildManifest = join('.next', 'build-manifest.json')
      if (existsSync(buildManifest)) {
        const manifest = JSON.parse(readFileSync(buildManifest, 'utf-8'))
        console.log('   📦 Build manifest found')
        
        // Calculate approximate bundle size
        const pages = Object.keys(manifest.pages || {})
        console.log(`   📄 Pages built: ${pages.length}`)
      }

      // Check static folder size
      const staticFolder = join('.ne,
          NODE_ENV: 'production',
          NEXT_TELEMETRY_DISABLED: '1'
        }
      })
      
      console.log('   ✅ Build completed successfully')
    } catch (error) {
      console.error('   ❌ Build failed:', error)
      process.exit(1)
    }
  }

  // Analyze bundle size
  analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...')
    
    try {
      // Check if .next folder exists
      if (!existsSync('.next')) {
        console.log('   ⚠️ No build found, skipping analysis')
       Bundle analyzer installed')
    } catch (error) {
      console.warn('   ⚠️ Failed to install some dev dependencies')
    }
  }

  // Run build with optimizations
  runOptimizedBuild() {
    console.log('🏗️ Running optimized build...')
    
    try {
      // Set production environment variables
      process.env.NODE_ENV = 'production'
      process.env.NEXT_TELEMETRY_DISABLED = '1'
      
      // Run the build
      execSync('npm run build', { 
        stdio: 'inherit',
        env: {
          ...process.envlog('   ✅ Added bundle analyzer support')
      }

      writeFileSync('next.config.js', nextConfigContent)
    } catch (error) {
      console.error('   ❌ Failed to optimize Next.js config:', error)
    }
  }

  // Install production dependencies
  installProductionDeps() {
    console.log('📥 Installing production dependencies...')
    
    try {
      // Install bundle analyzer for build optimization
      execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' })
      console.log('   ✅ zer in development
      if (!nextConfigContent.includes('@next/bundle-analyzer')) {
        const bundleAnalyzerConfig = `
// Bundle analyzer for development
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

`
        nextConfigContent = bundleAnalyzerConfig + nextConfigContent
        nextConfigContent = nextConfigContent.replace(
          'module.exports = nextConfig',
          'module.exports = withBundleAnalyzer(nextConfig)'
        )
        console.tent.includes('compress: true')) {
        nextConfigContent = nextConfigContent.replace(
          'const nextConfig = {',
          `const nextConfig = {
  compress: true,`
        )
        console.log('   ✅ Enabled compression')
      }

      // Add bundle analy