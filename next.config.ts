import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // FIXED: Moved from experimental to root level for Next.js 15
  serverExternalPackages: ['@prisma/client'],
  // Enable ESLint during builds for error checking
  eslint: {
    ignoreDuringBuilds: false,  // ✅ Enable checking
  },
  typescript: {
    ignoreBuildErrors: false,   // ✅ Enable checking
  },
  // Configure image optimization
  images: {
    localPatterns: [
      {
        pathname: '/logo.svg',
        search: '',
      },
    ],
    // Disable image optimization caching for logo
    unoptimized: false,
    minimumCacheTTL: 0,
  },
  // Configure for mobile development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // Add cache-busting headers for logo
      {
        source: '/logo.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
