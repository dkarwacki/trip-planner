/**
 * Supabase Server Instance Helper
 *
 * Creates a Supabase server client with proper cookie handling for SSR.
 * IMPORTANT: Uses ONLY getAll and setAll for cookie management.
 * DO NOT use individual get/set/remove methods.
 */

import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "@/infrastructure/common/database/types";

/**
 * Security: Proper cookie options
 * - httpOnly: Prevents JavaScript access to cookies
 * - secure: Ensures cookies are only sent over HTTPS
 * - sameSite: Protects against CSRF attacks
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse cookie header string into array format required by @supabase/ssr
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

interface SupabaseServerContext {
  headers: Headers;
  cookies: AstroCookies;
}

/**
 * Creates a Supabase server instance for use in Astro middleware and API routes.
 *
 * CRITICAL: This implementation uses ONLY getAll and setAll for cookie management.
 * DO NOT modify to use individual get/set/remove methods.
 */
export const createSupabaseServerInstance = (context: SupabaseServerContext) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerInstance>;
