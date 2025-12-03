/**
 * POST /api/auth/login
 *
 * Authenticates user with email/password.
 * On success, sets session cookies.
 */

import type { APIRoute } from "astro";
import { LoginCommandSchema } from "@/infrastructure/auth/api/schemas";
import { AuthenticationError } from "@/domain/auth/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = LoginCommandSchema.safeParse(body);
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

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[API /api/auth/login] Supabase error:", error);

      const authError = AuthenticationError.invalidCredentials();
      return new Response(
        JSON.stringify({
          success: false,
          error: authError.message,
          code: authError.code,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user || !data.session) {
      const authError = AuthenticationError.invalidCredentials();
      return new Response(
        JSON.stringify({
          success: false,
          error: authError.message,
          code: authError.code,
        }),
        {
          status: 401,
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
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[API /api/auth/login] Unexpected error:", err);
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


