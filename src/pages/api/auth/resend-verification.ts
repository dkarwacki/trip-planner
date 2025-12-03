/**
 * POST /api/auth/resend-verification
 *
 * Resends the email verification link.
 */

import type { APIRoute } from "astro";
import { ResendVerificationCommandSchema } from "@/infrastructure/auth/api/schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = ResendVerificationCommandSchema.safeParse(body);
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

    // Resend verification email using OTP
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[API /api/auth/resend-verification] Supabase error:", error);
      // Don't reveal specifics for security
    }

    // Always return success for security
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[API /api/auth/resend-verification] Unexpected error:", err);
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


