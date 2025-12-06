/**
 * Auth API Mappers
 *
 * Convert DTOs to domain types.
 * Infrastructure layer owns the mapping responsibility.
 */

import type { SignupCommandDTO, LoginCommandDTO, UpdatePasswordCommandDTO } from "./types";
import type { SignUpCommand, SignInCommand, PasswordUpdateCommand } from "@/domain/auth/models/types";

/**
 * Maps authentication DTOs to domain command types
 */
export const toDomain = {
  /**
   * Map SignupCommandDTO to SignUpCommand
   */
  signUp: (dto: SignupCommandDTO): SignUpCommand => ({
    email: dto.email,
    password: dto.password,
  }),

  /**
   * Map LoginCommandDTO to SignInCommand
   */
  signIn: (dto: LoginCommandDTO): SignInCommand => ({
    email: dto.email,
    password: dto.password,
  }),

  /**
   * Map UpdatePasswordCommandDTO to PasswordUpdateCommand
   */
  updatePassword: (dto: UpdatePasswordCommandDTO): PasswordUpdateCommand => ({
    newPassword: dto.password,
  }),
};
