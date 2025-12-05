/**
 * API Configuration
 * Central configuration for API base URL and settings
 */

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
  const protocol = import.meta.env.PROD ? 'https' : 'http';
  return `${protocol}://${trimmed}`;
}

/**
 * Get the API URL from environment variables with automatic protocol handling
 */
export const API_URL = processEnvUrl(
  import.meta.env.VITE_API_URL,
  'http://localhost:3000'
);

/**
 * API Configuration
 */
export const apiConfig = {
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};
