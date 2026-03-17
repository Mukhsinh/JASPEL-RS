/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features untuk performance
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
    unoptimized: true, // Untuk Vercel free tier
  },
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Simple webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Compress responses
  compress: true,
  
  // Optimize for Vercel deployment
  poweredByHeader: false,
  
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