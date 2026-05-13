import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

/**
 * Public canonical site URL (no secrets). Used by the login OTP client so
 * `emailRedirectTo` matches production even when the user opened the app on
 * *.onrender.com — avoids confirmation links pointing at Render.
 */
export async function GET() {
  return NextResponse.json({ siteUrl: getPublicSiteUrl() });
}
