/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3003"]
    }
  },
  // Ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    ]
  },
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
    return config;
  },
}

module.exports = nextConfig