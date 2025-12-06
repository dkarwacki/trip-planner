/**
 * Registration Error
 *
 * Represents errors during user registration:
 * - Email already exists
 * - Weak password
 * - Invalid email format
 */

export type RegistrationErrorCode = "email_already_exists" | "weak_password" | "invalid_email" | "registration_failed";

export class RegistrationError {
  readonly _tag = "RegistrationError";

  constructor(
    readonly code: RegistrationErrorCode,
    readonly message: string
  ) {}

  static emailAlreadyExists(): RegistrationError {
    return new RegistrationError("email_already_exists", "An account with this email already exists");
  }

  static weakPassword(message?: string): RegistrationError {
    return new RegistrationError("weak_password", message ?? "Password does not meet requirements");
  }

  static invalidEmail(): RegistrationError {
    return new RegistrationError("invalid_email", "Please enter a valid email address");
  }

  static registrationFailed(message?: string): RegistrationError {
    return new RegistrationError("registration_failed", message ?? "Registration failed. Please try again.");
  }
}










