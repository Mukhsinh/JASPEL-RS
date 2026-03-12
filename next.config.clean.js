/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
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
    unoptimized: true,
  },
  
  // Enable source maps for development
  productionBrowserSourceMaps: false,
  
  // Clean webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Only apply fallbacks for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Optimize for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
  
  // Compress responses
  compress: true,
  
  // Optimize for Vercel deployment
  poweredByHeader: false,
  
  // Clean redirect configuration
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
  
  // Ensure proper static file serving
  trailingSlash: false,
  
  // Output configuration for better compatibility
  output: 'standalone',
}

module.exports = nextConfig