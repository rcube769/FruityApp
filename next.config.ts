import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable the middleware deprecation warning
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip build-time rendering for dynamic pages that need auth
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
