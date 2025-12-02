/**
 * POST /api/auth/signup
 *
 * Creates a new user account with email/password.
 * On success, automatically logs in the user and sets session cookies.
 */

import type { APIRoute } from "astro";
import { SignupCommandSchema } from "@/infrastructure/auth/api/schemas";
import { RegistrationError } from "@/domain/auth/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = SignupCommandSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = result.data;
    const { supabase } = locals;

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Auto-confirm for development (remove in production if email verification required)
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[API /api/auth/signup] Supabase error:", error);

      // Map Supabase errors to our domain errors
      if (error.message.includes("already registered")) {
        const regError = RegistrationError.emailAlreadyExists();
        return new Response(
          JSON.stringify({
            success: false,
            error: regError.message,
            code: regError.code,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const regError = RegistrationError.registrationFailed(error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: regError.message,
          code: regError.code,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Registration failed. Please try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success with user data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name,
          avatar: data.user.user_metadata?.avatar_url,
          emailVerified: data.user.email_confirmed_at !== null,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[API /api/auth/signup] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
