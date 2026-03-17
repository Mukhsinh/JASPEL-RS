/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features untuk performance
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts', 'decimal.js'],
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  // Skip ESLint during build to avoid conflicts
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Asset optimization
  images: {
    unoptimized: true, // Untuk Vercel free tier
    formats: ['image/webp', 'image/avif'],
  },
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Optimized webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fix for 'self is not defined' error
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    } else {
      // Only apply fallbacks for client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // OPTIMIZED: Faster development mode
    if (dev) {
      config.watchOptions = {
        poll: false, // Disable polling for better performance
        aggregateTimeout: 100, // Faster rebuild
      }
      
      // Optimize dev server
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
      
      // Ensure proper static file handling
      config.output = {
        ...config.output,
        publicPath: '/_next/',
      }
    } else {
      // Production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'recharts',
            chunks: 'async',
            priority: 20,
          },
          pdf: {
            test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable)[\\/]/,
            name: 'pdf',
            chunks: 'async',
            priority: 20,
          },
          excel: {
            test: /[\\/]node_modules[\\/](xlsx|exceljs)[\\/]/,
            name: 'excel',
            chunks: 'async',
            priority: 20,
          },
        },
      }
    }
    
    return config
  },
  
  // Compress responses
  compress: true,
  
  // Optimize for Vercel deployment
  poweredByHeader: false,
  
  // Ensure proper static file serving
  trailingSlash: false,
  
  // Headers untuk caching dan security
  async headers() {
    return [
      {
        source: '/api/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=120, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig