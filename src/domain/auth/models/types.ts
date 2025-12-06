/**
 * Auth Domain Types
 *
 * Common types and interfaces for authentication domain.
 */

import type { User } from "./User";
import type { Session } from "./Session";

/**
 * Result of a successful authentication operation
 */
export interface AuthResult {
  readonly user: User;
  readonly session: Session;
}

/**
 * Password validation requirements
 */
export interface PasswordRequirements {
  readonly minLength: number;
  readonly requireSpecialChar: boolean;
  readonly requireNumber?: boolean;
  readonly requireUppercase?: boolean;
}

/**
 * Default password requirements
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireSpecialChar: true,
  requireNumber: true,
  requireUppercase: true,
};

/**
 * OAuth provider types
 */
export type OAuthProvider = "google";

/**
 * Sign up command for domain
 */
export interface SignUpCommand {
  readonly email: string;
  readonly password: string;
}

/**
 * Sign in command for domain
 */
export interface SignInCommand {
  readonly email: string;
  readonly password: string;
}

/**
 * Password reset request command
 */
export interface PasswordResetRequestCommand {
  readonly email: string;
}

/**
 * Password update command
 */
export interface PasswordUpdateCommand {
  readonly newPassword: string;
}










