/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  
  // Disable React strict mode to prevent RSC payload conflicts
  reactStrictMode: false,
  
  // Skip ESLint during build to avoid chunk conflicts
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
  
  // Disable source maps to prevent version conflicts
  productionBrowserSourceMaps: false,
  
  // Simplified webpack config to prevent chunk loading errors
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        canvas: false,
        html2canvas: false,
        dompurify: false,
        canvg: false,
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