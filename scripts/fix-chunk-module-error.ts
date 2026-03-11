#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync, rmSync, writeFileSync } from 'fs'
import path from 'path'

console.log('🔧 Memperbaiki Chunk Module Error...')

// 1. Stop any running processes
console.log('⏹️ Menghentikan proses yang berjalan...')
try {
  execSync('taskkill /f /im node.exe', { stdio: 'ignore' })
} catch (error) {
  // Process might not be running
}

// 2. Clean build artifacts
console.log('🧹 Membersihkan build artifacts...')
const pathsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo'
]

pathsToClean.forEach(p => {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true })
    console.log(`✅ ${p} dihapus`)
  }
})

// 3. Clear npm cache
console.log('🧹 Membersihkan npm cache...')
try {
  execSync('npm cache clean --force', { stdio: 'inherit' })
} catch (error) {
  console.log('⚠️ Gagal membersihkan npm cache, melanjutkan...')
}

// 4. Update next.config.js to disable turbopack
console.log('⚙️ Mengupdate konfigurasi Next.js...')
const nextConfigPath = 'next.config.js'
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Vercel
  output: 'standalone',
  
  // Explicitly use App Router (Next.js 15)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Optimize page loading
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
    // Disable turbopack for stability
    turbo: false,
  },
  
  // Image optimization
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable React strict mode for better performance
  reactStrictMode: true,
  
  // Skip ESLint during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript errors during build (for faster iteration)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Compress responses
  compress: true,
  
  // Ensure we're using App Router
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Webpack config for better module resolution
  webpack: (config, { isServer, dev }) => {
    // Resolve fallback for server-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // Better module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    
    // Optimize chunks in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\\\/]node_modules[\\\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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

module.exports = nextConfig
`

writeFileSync(nextConfigPath, nextConfigContent)
console.log('✅ next.config.js diupdate')

// 5. Reinstall dependencies
console.log('📦 Menginstall ulang dependencies...')
if (existsSync('node_modules')) {
  rmSync('node_modules', { recursive: true, force: true })
}
if (existsSync('package-lock.json')) {
  rmSync('package-lock.json')
}

try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies berhasil diinstall')
} catch (error) {
  console.error('❌ Gagal menginstall dependencies:', error)
  process.exit(1)
}

console.log('✅ Perbaikan selesai!')
console.log('🚀 Silakan jalankan: npm run dev')