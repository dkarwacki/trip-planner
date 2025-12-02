/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/common/database/types";

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  readonly GOOGLE_MAPS_API_KEY: string;
  readonly GOOGLE_MAPS_API_KEY_PUBLIC: string;
  readonly GOOGLE_MAPS_MAP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * User data available in Astro.locals after middleware authentication
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: AuthUser;
    }
  }
}
