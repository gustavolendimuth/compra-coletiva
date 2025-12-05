/**
 * Authentication API Client (Legacy Re-export)
 *
 * This file now re-exports from the new modular API structure.
 * Kept for backward compatibility with existing imports.
 *
 * NEW CODE SHOULD IMPORT FROM: '../api' instead
 */

// Re-export types and service from new API structure
export type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshResponse,
  StoredUser
} from '../api';

export { authService as authApi } from '../api';
