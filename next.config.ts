import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Izin untuk Cloudinary
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Izin untuk Supabase Storage (Foto lama)
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
