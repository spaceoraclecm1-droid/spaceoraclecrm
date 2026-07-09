import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // This is a temporary solution to ignore TypeScript errors during build for deployment
    // Remove this once all type issues are properly resolved
    ignoreBuildErrors: true,
  },
  // Add ESLint ignore setting
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Configure image domains
  images: {
    domains: ['i.ibb.co'],
  },
};

export default nextConfig;
