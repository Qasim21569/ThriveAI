/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true,
  optimizeFonts: true,
  
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3003"]
    },
    optimizeCss: true,       // Enable CSS optimization
    optimizePackageImports: ['framer-motion', '@mui/material', '@mui/icons-material'],
  },
  
  // Ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimize image loading
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Improve compilation speed
  webpack: (config, { isServer }) => {
    // Add polyfills for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        encoding: false
      };
    }
    
    // Add cache groups for better chunking
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Create a separate chunk for react
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'framework',
            priority: 40,
            chunks: 'all',
          },
          // Create a separate chunk for UI components
          components: {
            test: /[\\/]components[\\/]/,
            name: 'components',
            priority: 30,
            chunks: 'all',
          },
          // Create a separate chunk for larger third party modules
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 20,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
}

module.exports = nextConfig