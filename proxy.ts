import { NextResponse, type NextRequest } from "next/server";
import { getMiddlewareSupabase } from "@/lib/supabase-server";
import { sanitizeAuthNextPath } from "@/lib/site-url";

const PROTECTED_PREFIXES = ["/exam", "/swot", "/plan", "/dashboard", "/onboarding", "/profile"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = getMiddlewareSupabase(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    const nextPath = sanitizeAuthNextPath(url.searchParams.get("next"), "/exam");
    url.pathname = nextPath;
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|questions/|api/health|.*\\..*).*)",
  ],
};
