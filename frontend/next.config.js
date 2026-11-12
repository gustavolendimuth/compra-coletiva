const { buildImageRemotePatterns } = require('./imageRemotePatterns');

// Sem script-src por enquanto (nonce deixaria todas as páginas dinâmicas)
const CONTENT_SECURITY_POLICY = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'";

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows overriding output directory in restricted environments
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Enable React Strict Mode
  reactStrictMode: true,

  // Image optimization: só o bucket S3 configurado e o /uploads da API
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },

  // Security headers em todas as rotas
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
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
