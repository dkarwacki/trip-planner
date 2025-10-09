/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly GOOGLE_MAPS_API_KEY: string;
  readonly GOOGLE_MAPS_API_KEY_PUBLIC: string;
  readonly GOOGLE_MAPS_MAP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
