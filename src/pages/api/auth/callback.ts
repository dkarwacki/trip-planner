/**
 * GET /api/auth/callback
 *
 * Handles OAuth and magic link callbacks.
 * Exchanges the code for a session and redirects appropriately.
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect") ?? "/";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle OAuth error from provider
  if (errorParam) {
    console.error("[API /api/auth/callback] OAuth error:", errorParam, errorDescription);
    return redirect(`/login?error=${encodeURIComponent(errorDescription ?? errorParam)}`);
  }

  // Exchange code for session if present
  if (code) {
    const { supabase } = locals;
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[API /api/auth/callback] Code exchange error:", error);
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Redirect to intended destination (or home)
  return redirect(redirectTo);
};


