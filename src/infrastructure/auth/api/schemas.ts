/**
 * Auth API Validation Schemas
 *
 * Zod schemas for authentication endpoints.
 * Following project patterns with validation and transforms.
 */

import { z } from "zod";

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Email validation schema
 */
export const EmailSchema = z.string().email("Please enter a valid email address");

/**
 * Password validation schema with requirements:
 * - Minimum 8 characters
 * - At least 1 special character
 */
export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character");

/**
 * Simple password schema (for login, where we don't enforce requirements)
 */
export const LoginPasswordSchema = z.string().min(1, "Password is required");

// ============================================================================
// Command Schemas (API Inputs)
// ============================================================================

/**
 * Command schema for POST /api/auth/signup
 * Input: Create new user account
 */
export const SignupCommandSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Command schema for POST /api/auth/login
 * Input: Email/password authentication
 */
export const LoginCommandSchema = z.object({
  email: EmailSchema,
  password: LoginPasswordSchema,
});

/**
 * Command schema for POST /api/auth/reset-password
 * Input: Request password reset email
 */
export const ResetPasswordCommandSchema = z.object({
  email: EmailSchema,
});

/**
 * Command schema for POST /api/auth/update-password
 * Input: Set new password (with token from email)
 */
export const UpdatePasswordCommandSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Command schema for POST /api/auth/resend-verification
 * Input: Resend email verification
 */
export const ResendVerificationCommandSchema = z.object({
  email: EmailSchema,
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * User data schema for responses
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  emailVerified: z.boolean(),
});

/**
 * Auth success response schema
 */
export const AuthSuccessResponseSchema = z.object({
  success: z.literal(true),
  user: UserResponseSchema,
});

/**
 * Auth error response schema
 */
export const AuthErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

/**
 * Generic success response (for logout, password reset request, etc.)
 */
export const GenericSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});


