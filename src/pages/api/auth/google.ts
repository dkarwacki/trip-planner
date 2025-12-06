/**
 * GET /api/auth/google
 *
 * Initiates Google OAuth flow server-side with PKCE.
 * Using the server-side Supabase client ensures the code verifier
 * is stored in cookies (via @supabase/ssr), making it accessible
 * when exchanging the code in the callback.
 *
 * @see https://supabase.com/docs/guides/auth/sessions/pkce-flow
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const { supabase } = locals;
  const redirectTo = url.searchParams.get("redirect") ?? "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${url.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    console.error("[API /api/auth/google] OAuth error:", error);
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
    console.error("[API /api/auth/google] No OAuth URL returned");
    return redirect(`/login?error=${encodeURIComponent("Failed to initiate Google sign-in")}`);
  }

  // Redirect to Google OAuth consent page
  return redirect(data.url);
};
