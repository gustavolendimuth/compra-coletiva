/**
 * Check if we're in production
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Process environment variable URL with automatic protocol handling
 *
 * Rules:
 * - If protocol is already specified (http:// or https://), use as-is
 * - Local domains (localhost, 127.0.0.1, 0.0.0.0) always use http://
 * - Remote domains use https:// in production, http:// in development
 */
export function processEnvUrl(url: string | undefined, fallback: string): string {
  if (!url) {
    return fallback;
  }

  const trimmed = url.trim();

  // If protocol is already specified, use as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Determine if domain is local
  const isLocal = trimmed.includes('localhost') ||
                 trimmed.includes('127.0.0.1') ||
                 trimmed.includes('0.0.0.0');

  // Local domains always use http
  if (isLocal) {
    return `http://${trimmed}`;
  }

  // Remote domains: use https in production, http in development
  const protocol = isProduction ? 'https' : 'http';
  return `${protocol}://${trimmed}`;
}

/**
 * Get the API URL from environment variables with automatic protocol handling
 *
 * Server-side: Uses INTERNAL_API_URL for Docker inter-container communication
 * Client-side: Uses NEXT_PUBLIC_API_URL for browser access
 */
const isServer = typeof window === 'undefined';

export const API_URL = isServer
  ? processEnvUrl(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3000')
  : processEnvUrl(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3000');
