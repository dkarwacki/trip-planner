/**
 * POST /api/auth/reset-password
 *
 * Sends a password reset email to the specified email address.
 * Always returns success for security (don't reveal if email exists).
 */

import type { APIRoute } from "astro";
import { ResetPasswordCommandSchema } from "@/infrastructure/auth/api/schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = ResetPasswordCommandSchema.safeParse(body);
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

    const { email } = result.data;
    const { supabase } = locals;

    // Request password reset from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/update-password`,
    });

    if (error) {
      console.error("[API /api/auth/reset-password] Supabase error:", error);
      // Don't reveal if the email exists - always return success for security
    }

    // Always return success (security: don't reveal if email exists)
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[API /api/auth/reset-password] Unexpected error:", err);
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
