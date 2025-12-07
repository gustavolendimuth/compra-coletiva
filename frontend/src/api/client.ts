/**
 * API Client with Axios
 * Configured with authentication interceptors and token refresh logic
 */

import axios, { AxiosInstance } from "axios";
import { apiConfig } from "./config";
import { authStorage } from "../lib/authStorage";
import { RefreshResponse } from "./types";

/**
 * Main API client instance
 */
export const apiClient: AxiosInstance = axios.create(apiConfig);

/**
 * Separate axios instance for auth endpoints to avoid circular dependencies
 */
export const authClient: AxiosInstance = axios.create(apiConfig);

// ============================================================================
// Request Interceptor: Add Authorization Header
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor: Handle 401 and Refresh Token
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Process all queued requests after token refresh
 */
const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing token, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = authStorage.getRefreshToken();

    if (!refreshToken) {
      // No refresh token, clear auth and reject
      authStorage.clearAuth();
      processQueue(new Error("No refresh token"));
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      // Try to refresh the access token using authClient to avoid circular dependency
      // RefreshToken is now sent via HttpOnly cookie automatically (withCredentials: true)
      // But we also send in body for backward compatibility with older backend versions
      const response = await authClient.post<RefreshResponse>("/auth/refresh", {
        refreshToken,
      });

      const { accessToken } = response.data;
      authStorage.setAccessToken(accessToken);

      // Update the failed request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue();
      isRefreshing = false;

      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear auth and reject
      authStorage.clearAuth();
      processQueue(refreshError);
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  }
);
