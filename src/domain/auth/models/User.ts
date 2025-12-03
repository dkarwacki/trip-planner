/**
 * User Domain Model
 *
 * Core user entity representing an authenticated user in the system.
 * Contains essential user information without authentication details.
 */

import { Brand } from "effect";

/**
 * Branded type for User ID (Supabase auth UUID)
 */
export type UserId = string & Brand.Brand<"UserId">;
export const UserId = Brand.nominal<UserId>();

/**
 * User domain model
 * Represents an authenticated user with basic profile information
 */
export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly name?: string;
  readonly avatar?: string;
  readonly emailVerified: boolean;
  readonly createdAt?: Date;
}

/**
 * Creates a User from raw data
 */
export const createUser = (data: {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt?: Date;
}): User => ({
  id: UserId(data.id),
  email: data.email,
  name: data.name,
  avatar: data.avatar,
  emailVerified: data.emailVerified,
  createdAt: data.createdAt,
});






