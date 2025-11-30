import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // reactCompiler: true,  // COMMENT TEMPORARILY
  compress: true,

  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      'date-fns',
      'react-hot-toast',
      'zustand',
      'clsx',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
