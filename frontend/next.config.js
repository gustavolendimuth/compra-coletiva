/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'localhost:3000',
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Trailing slashes configuration
  trailingSlash: false,

  // Output configuration for Docker
  output: 'standalone',
};

module.exports = nextConfig;
