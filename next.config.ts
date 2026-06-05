import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Autoriza qualquer projeto do Supabase
      },
    ],
  },
};

export default nextConfig;