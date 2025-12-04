/**
 * Session Domain Model
 *
 * Represents an authenticated session with access and refresh tokens.
 * Used for JWT-based authentication with Supabase.
 */

import type { User } from "./User";

/**
 * Session domain model
 * Represents an active authentication session
 */
export interface Session {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly user: User;
}

/**
 * Session expiration check
 */
export const isSessionExpired = (session: Session): boolean => {
  return Date.now() >= session.expiresAt * 1000;
};








