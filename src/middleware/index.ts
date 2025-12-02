import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "@/infrastructure/auth/supabase-server";

/**
 * Public paths - Auth pages and API endpoints that don't require authentication
 */
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/update-password",
  "/auth/callback",
  "/verify-email",
  // Auth API endpoints
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
  "/api/auth/callback",
  "/api/auth/resend-verification",
];

/**
 * Check if a path is public (doesn't require authentication)
 */
const isPublicPath = (pathname: string): boolean => {
  // Exact match for listed paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  // Auth API endpoints prefix
  if (pathname.startsWith("/api/auth/")) {
    return true;
  }

  // Static assets and internal Astro paths
  if (pathname.startsWith("/_") || pathname.startsWith("/favicon")) {
    return true;
  }

  return false;
};

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client with proper cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  locals.supabase = supabase;

  // IMPORTANT: Always call auth.getUser() - DO NOT skip this call
  // DO NOT use getSession() - use getUser() for security (validates JWT with Supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url,
      emailVerified: user.email_confirmed_at !== null,
    };
  }

  const pathname = url.pathname;

  // Check if path is public
  if (isPublicPath(pathname)) {
    // Redirect authenticated users away from auth pages (login, signup)
    if (user && ["/login", "/signup"].includes(pathname)) {
      const redirectTo = url.searchParams.get("redirect") ?? "/";
      return redirect(redirectTo);
    }

    return next();
  }

  // Protected route - redirect unauthenticated users to login
  if (!user) {
    return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return next();
});
