/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Vercel
  output: 'standalone',
  
  // Basic experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
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
  
  // Asset optimization
  images: {
    unoptimized: true,
  },
  
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  
  // Simple webpack config
  webpack: (config, { isServer }) => {
    // Only add essential fallbacks for client-side
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
}

module.exports = nextConfig