/**
 * Auth Store Types
 *
 * Types for the authentication Zustand store.
 */

/**
 * User data in auth store (mirrors AuthUser from env.d.ts)
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
}

/**
 * Auth state
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  emailVerificationDismissed: boolean;
}

/**
 * Auth actions
 */
export interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  dismissEmailVerification: () => void;
}

/**
 * Complete auth store type
 */
export type AuthStore = AuthState & AuthActions;






