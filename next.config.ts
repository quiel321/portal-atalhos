import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() { return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] }]; },
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