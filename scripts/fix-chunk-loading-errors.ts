#!/usr/bin/env tsx

/**
 * Comprehensive fix for chunk loading and static asset errors
 * Addresses 404 errors and module loading issues
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

console.log('🔧 Starting comprehensive chunk loading error fix...')

// 1. Stop any running Next.js processes
console.log('1. Stopping any running processes...')
try {
  execSync('taskkill /f /im node.exe 2>nul', { stdio: 'ignore' })
  execSync('taskkill /f /im next.exe 2>nul', { stdio: 'ignore' })
} catch (error) {
  // Ignore errors if no processes found
}

// 2. Clean build artifacts and cache
console.log('2. Cleaning build artifacts and cache...')
const dirsToClean = ['.next', 'node_modules/.cache', '.vercel']
for (const dir of dirsToClean) {
  try {
    if (existsSync(dir)) {
      execSync(`rmdir /s /q "${dir}"`, { stdio: 'ignore' })
      console.log(`   ✓ Cleaned ${dir}`)
    }
  } catch (error) {
    console.log(`   ⚠ Could not clean ${dir}`)
  }
}

// 3. Update Next.js configuration for better chunk handling
console.log('3. Updating Next.js configuration...')
const nextConfigPath = 'next.config.js'
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Vercel
  output: 'standalone',
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Webpack configuration for better chunk handling
  webpack: (config, { isServer, dev }) => {
    // Only add essential fallbacks for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Optimize chunks in production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig`

writeFileSync(nextConfigPath, nextConfig)
console.log('   ✓ Updated next.config.js')

// 4. Update package.json scripts for better development
console.log('4. Updating package.json scripts...')
const packageJsonPath = 'package.json'
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "dev": "next dev -p 3002",
    "dev:clean": "npm run clean && next dev -p 3002",
    "dev:turbo": "next dev -p 3002 --turbo",
    "build": "next build",
    "start": "next start -p 3002",
    "clean": "rmdir /s /q .next 2>nul || echo Cache cleaned",
    "restart": "npm run clean && npm run dev"
  }
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('   ✓ Updated package.json scripts')
}

// 5. Create a middleware fix for static assets
console.log('5. Checking middleware configuration...')
const middlewarePath = 'middleware.ts'
if (existsSync(middlewarePath)) {
  const middlewareContent = readFileSync(middlewarePath, 'utf8')
  
  // Check if static asset handling is properly configured
  if (!middlewareContent.includes('_next/static')) {
    console.log('   ⚠ Middleware may need static asset handling updates')
  } else {
    console.log('   ✓ Middleware static asset handling looks good')
  }
}

// 6. Install dependencies fresh
console.log('6. Reinstalling dependencies...')
try {
  execSync('npm ci', { stdio: 'inherit' })
  console.log('   ✓ Dependencies reinstalled')
} catch (error) {
  console.log('   ⚠ Using npm install as fallback...')
  execSync('npm install', { stdio: 'inherit' })
}

// 7. Create a startup script with error handling
console.log('7. Creating startup script...')
const startupScript = `@echo off
echo Starting JASPEL application with error handling...

REM Kill any existing processes
taskkill /f /im node.exe 2>nul
taskkill /f /im next.exe 2>nul

REM Clean cache if needed
if exist .next\\cache rmdir /s /q .next\\cache

REM Start the application
echo Starting development server on port 3002...
npm run dev

pause`

writeFileSync('START_CLEAN.bat', startupScript)
console.log('   ✓ Created START_CLEAN.bat')

console.log('\n✅ Chunk loading error fix completed!')
console.log('\nNext steps:')
console.log('1. Run: START_CLEAN.bat')
console.log('2. Or run: npm run dev:clean')
console.log('3. Wait for compilation to complete')
console.log('4. Access: http://localhost:3002')