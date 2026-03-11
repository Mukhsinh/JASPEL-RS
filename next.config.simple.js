/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Output configuration for Vercel
  output: 'standalone',
  
  // Explicitly use App Router (Next.js 15)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
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
  
  // Simplified webpack config to prevent module resolution errors
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
    
    // Prevent webpack module resolution errors
    config.resolve.symlinks = false;
    
    // More stable chunk configuration for development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\\\/]node_modules[\\\\/]/,
              name: 'vendors',
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