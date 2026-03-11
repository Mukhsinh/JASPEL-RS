# PowerShell script to fix static asset loading issues
Write-Host "🔧 Fixing static asset loading issues..." -ForegroundColor Green

# Stop any running processes
Write-Host "1. Stopping running processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean build directories
Write-Host "2. Cleaning build directories..." -ForegroundColor Yellow
$dirsToClean = @(".next", "node_modules\.cache", ".vercel", "out")
foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "   ✓ Cleaned $dir" -ForegroundColor Green
    }
}

# Clear npm cache
Write-Host "3. Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Reinstall dependencies
Write-Host "4. Reinstalling dependencies..." -ForegroundColor Yellow
npm ci

# Create optimized next.config.js
Write-Host "5. Creating optimized configuration..." -ForegroundColor Yellow
$nextConfig = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  
  reactStrictMode: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      }
    }
    
    return config
  },
  
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

module.exports = nextConfig
"@

$nextConfig | Out-File -FilePath "next.config.js" -Encoding UTF8

Write-Host "6. Starting development server..." -ForegroundColor Yellow
Write-Host "   Access the application at: http://localhost:3002" -ForegroundColor Cyan

# Start the development server
npm run dev