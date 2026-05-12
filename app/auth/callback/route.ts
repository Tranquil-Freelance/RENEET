import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, getServiceClient } from "@/lib/supabase-server";
import { getAuthCallbackRedirectOrigin, sanitizeAuthNextPath } from "@/lib/site-url";

/**
 * Email OTP magic-link callback.
 *
 * Supabase appends `?code=...` (PKCE) when the user clicks the link.
 * We exchange that for a session cookie, then bootstrap a `public.users`
 * row (if missing) and redirect to `?next` or `/onboarding`.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const origin = getAuthCallbackRedirectOrigin(request.url);
  const code = searchParams.get("code");
  const next = sanitizeAuthNextPath(searchParams.get("next"), "/onboarding");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth/callback] exchange error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // Ensure a `public.users` row exists for this auth user.
  try {
    const service = getServiceClient();
    const { data: existing } = await service
      .from("users")
      .select("id, state, attempt_no")
      .eq("auth_id", data.user.id)
      .maybeSingle();

    let redirectTo = next;
    if (!existing) {
      await service.from("users").insert({
        auth_id: data.user.id,
        email: data.user.email ?? null,
        name: "Student",
      });
      redirectTo = "/onboarding";
    } else if (!existing.state) {
      redirectTo = "/onboarding";
    }
    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch (err) {
    console.warn("[auth/callback] user bootstrap warning:", err);
    return NextResponse.redirect(`${origin}${next}`);
  }
}
