/**
 * POST /api/auth/update-password
 *
 * Updates the password for the authenticated user.
 * Used after clicking the password reset link from email.
 */

import type { APIRoute } from "astro";
import { UpdatePasswordCommandSchema } from "@/infrastructure/auth/api/schemas";
import { PasswordResetError } from "@/domain/auth/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = UpdatePasswordCommandSchema.safeParse(body);
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

    const { password } = result.data;
    const { supabase } = locals;

    // Update password in Supabase
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("[API /api/auth/update-password] Supabase error:", error);

      // Map Supabase errors to our domain errors
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        const resetError = PasswordResetError.expiredToken();
        return new Response(
          JSON.stringify({
            success: false,
            error: resetError.message,
            code: resetError.code,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[API /api/auth/update-password] Unexpected error:", err);
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
