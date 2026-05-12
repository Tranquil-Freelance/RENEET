import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Browser-side Supabase client with cookie-based session.
 * Used in client components for sign-in and sign-out.
 */
export function getBrowserSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or anon key is missing.");
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function isSupabaseBrowserConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
