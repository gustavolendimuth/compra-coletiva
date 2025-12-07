/**
 * Cookie Configuration
 * Centralized configuration for HTTP-only refresh token cookies
 */

import { CookieOptions } from "express";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

// Cookie expiration: 7 days (same as refresh token)
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Get cookie options based on environment
 * Cross-domain cookies require SameSite=None and Secure=true
 */
export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "none" : "lax", // Cross-domain in production
    maxAge: COOKIE_MAX_AGE,
    path: "/", // Available for all paths
  };
};

/**
 * Get cookie options for clearing the cookie
 */
export const getClearCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
};

export { REFRESH_TOKEN_COOKIE_NAME };



