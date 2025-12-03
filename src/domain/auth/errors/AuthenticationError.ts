/**
 * Authentication Error
 *
 * Represents errors during authentication operations:
 * - Invalid credentials
 * - Expired sessions
 * - OAuth failures
 */

export type AuthenticationErrorCode = "invalid_credentials" | "session_expired" | "oauth_failed" | "email_not_verified";

export class AuthenticationError {
  readonly _tag = "AuthenticationError";

  constructor(
    readonly code: AuthenticationErrorCode,
    readonly message: string
  ) {}

  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError("invalid_credentials", "Invalid email or password");
  }

  static sessionExpired(): AuthenticationError {
    return new AuthenticationError("session_expired", "Your session has expired. Please log in again.");
  }

  static oauthFailed(message?: string): AuthenticationError {
    return new AuthenticationError("oauth_failed", message ?? "Authentication failed. Please try again.");
  }

  static emailNotVerified(): AuthenticationError {
    return new AuthenticationError("email_not_verified", "Please verify your email address before logging in.");
  }
}






