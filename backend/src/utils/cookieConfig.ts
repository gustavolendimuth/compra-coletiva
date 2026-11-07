/**
 * Cookie Configuration
 * Centralized configuration for HTTP-only refresh token cookies
 */

import { CookieOptions } from "express";
import { REFRESH_TOKEN_TTL_MS } from "../config/session";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

// Cookie expiration: same TTL as the refresh token (30 days)
const COOKIE_MAX_AGE = REFRESH_TOKEN_TTL_MS;

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



