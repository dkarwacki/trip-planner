/**
 * Password Reset Error
 *
 * Represents errors during password reset operations:
 * - Invalid or expired token
 * - Password requirements not met
 */

export type PasswordResetErrorCode = "invalid_token" | "expired_token" | "password_requirements_not_met";

export class PasswordResetError {
  readonly _tag = "PasswordResetError";

  constructor(
    readonly code: PasswordResetErrorCode,
    readonly message: string
  ) {}

  static invalidToken(): PasswordResetError {
    return new PasswordResetError("invalid_token", "The password reset link is invalid");
  }

  static expiredToken(): PasswordResetError {
    return new PasswordResetError("expired_token", "The password reset link has expired. Please request a new one.");
  }

  static passwordRequirementsNotMet(message?: string): PasswordResetError {
    return new PasswordResetError("password_requirements_not_met", message ?? "Password does not meet requirements");
  }
}
