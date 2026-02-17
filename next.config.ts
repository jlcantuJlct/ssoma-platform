import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Aumentado para archivos grandes (requiere Vercel Pro para >4.5MB)
    },
  },
};

export default nextConfig;
