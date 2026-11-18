import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://zzlynalvbfxvmwukftdx.supabase.co";
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_yB2b_B0jpWjikuPRUCd3pw_Du83ULyY";
export const DEFAULT_SUPABASE_JWKS_URL =
  "https://zzlynalvbfxvmwukftdx.supabase.co/auth/v1/.well-known/jwks.json";

export function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  const jwksUrl =
    process.env.SUPABASE_JWKS_URL || DEFAULT_SUPABASE_JWKS_URL;

  return { url, publishableKey, jwksUrl };
}

export function isSupabaseConfigured(): boolean {
  const { url, publishableKey } = getSupabaseEnv();
  return Boolean(
    url &&
      publishableKey &&
      url.startsWith("http") &&
      !url.includes("your-project-id.supabase.co")
  );
}

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
