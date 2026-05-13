import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAuthCallbackRedirectOrigin, sanitizeAuthNextPath } from "@/lib/site-url";

/**
 * Email OTP magic-link callback.
 *
 * Supabase appends `?code=...` (PKCE) when the user clicks the link.
 * We exchange that for a session cookie, then bootstrap a `public.users`
 * row (if missing) and redirect to `?next` or `/onboarding`.
 *
 * Default `next` is `/exam` (not `/onboarding`): Supabase often returns only
 * `?code=` on the callback URL, dropping our original `next` query — returning
 * users should land on the exam flow, not onboarding.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const origin = getAuthCallbackRedirectOrigin(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");

  const cookieStore = await cookies();
  const cookieRaw = cookieStore.get("prepinsights_intended_next")?.value;
  let fromCookie: string | null = null;
  if (cookieRaw) {
    try {
      fromCookie = decodeURIComponent(cookieRaw);
    } catch {
      fromCookie = null;
    }
  }
  const next = sanitizeAuthNextPath(searchParams.get("next") ?? fromCookie, "/exam");

  const allowedOtpTypes = new Set([
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
  ]);
  const canVerifyOtp =
    Boolean(tokenHash) && Boolean(otpType) && allowedOtpTypes.has(otpType as string);

  if (!code && !canVerifyOtp) {
    const res = NextResponse.redirect(`${origin}/login?error=missing_code`);
    res.cookies.delete("prepinsights_intended_next");
    return res;
  }

  const supabase = await getServerSupabase();
  const authResult = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: otpType as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
      });
  const { data, error } = authResult;
  if (error || !data.user) {
    console.error("[auth/callback] exchange error:", error?.message);
    const res = NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    res.cookies.delete("prepinsights_intended_next");
    return res;
  }

  // Ensure a `public.users` row exists for this auth user (RLS — same session client).
  try {
    const { data: existing } = await supabase
      .from("users")
      .select("id, state, attempt_no")
      .maybeSingle();

    let redirectTo = next;
    if (!existing) {
      await supabase.from("users").insert({
        auth_id: data.user.id,
        email: data.user.email ?? null,
        name: "Student",
      });
      redirectTo = "/onboarding";
    } else if (!existing.state) {
      redirectTo = "/onboarding";
    }
    const res = NextResponse.redirect(`${origin}${redirectTo}`);
    res.cookies.delete("prepinsights_intended_next");
    return res;
  } catch (err) {
    console.warn("[auth/callback] user bootstrap warning:", err);
    const res = NextResponse.redirect(`${origin}${next}`);
    res.cookies.delete("prepinsights_intended_next");
    return res;
  }
}
