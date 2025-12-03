/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears session cookies.
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { supabase } = locals;

    // Sign out from Supabase (clears session cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[API /api/auth/logout] Supabase error:", error);
      // Still return success - user wanted to log out
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[API /api/auth/logout] Unexpected error:", err);
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


