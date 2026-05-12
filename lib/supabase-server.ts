import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Use this in route handlers and server components to read `auth.uid()`.
 */
export async function getServerSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or anon key is missing.");
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Read-only context (Server Component). Middleware handles refresh.
        }
      },
    },
  });
}

/**
 * Service-role client that bypasses RLS. Use ONLY in server-side code where
 * the user is already authenticated (we resolve the auth user id separately
 * via `getServerSupabase()` and write rows on their behalf).
 */
export function getServiceClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Supabase service env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

/**
 * Middleware-friendly client that reads/writes cookies on the request/response.
 * Used by middleware.ts to refresh the session on every request.
 */
export function getMiddlewareSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}

/**
 * Returns the internal `public.users.id` for the currently signed-in auth user,
 * creating the row if needed. Returns `null` if no session.
 */
export async function getOrCreateAppUserId(): Promise<string | null> {
  const supa = await getServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  const service = getServiceClient();
  const { data: existing } = await service
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await service
    .from("users")
    .insert({
      auth_id: user.id,
      email: user.email ?? null,
      name: (user.user_metadata?.full_name as string | undefined) ?? "Student",
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[supabase] failed to create app user:", error.message);
    return null;
  }
  return created.id as string;
}
