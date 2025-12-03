/**
 * Auth API DTOs
 *
 * Type-safe API request/response contracts for authentication.
 * All DTOs are derived from validation schemas using z.infer<>.
 */

import type { z } from "zod";
import type {
  SignupCommandSchema,
  LoginCommandSchema,
  ResetPasswordCommandSchema,
  UpdatePasswordCommandSchema,
  ResendVerificationCommandSchema,
  UserResponseSchema,
  AuthSuccessResponseSchema,
  AuthErrorResponseSchema,
  GenericSuccessResponseSchema,
} from "./schemas";

// ============================================================================
// Command DTOs (API Inputs)
// ============================================================================

/**
 * DTO for POST /api/auth/signup
 */
export type SignupCommandDTO = z.infer<typeof SignupCommandSchema>;

/**
 * DTO for POST /api/auth/login
 */
export type LoginCommandDTO = z.infer<typeof LoginCommandSchema>;

/**
 * DTO for POST /api/auth/reset-password
 */
export type ResetPasswordCommandDTO = z.infer<typeof ResetPasswordCommandSchema>;

/**
 * DTO for POST /api/auth/update-password
 */
export type UpdatePasswordCommandDTO = z.infer<typeof UpdatePasswordCommandSchema>;

/**
 * DTO for POST /api/auth/resend-verification
 */
export type ResendVerificationCommandDTO = z.infer<typeof ResendVerificationCommandSchema>;

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * User data in responses
 */
export type UserResponseDTO = z.infer<typeof UserResponseSchema>;

/**
 * Successful auth response
 */
export type AuthSuccessResponseDTO = z.infer<typeof AuthSuccessResponseSchema>;

/**
 * Error auth response
 */
export type AuthErrorResponseDTO = z.infer<typeof AuthErrorResponseSchema>;

/**
 * Generic success response
 */
export type GenericSuccessResponseDTO = z.infer<typeof GenericSuccessResponseSchema>;


