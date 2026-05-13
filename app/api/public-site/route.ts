import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

/**
 * Public canonical site URL (no secrets). Useful for client-side features
 * that must match production hostname.
 */
export async function GET() {
  return NextResponse.json({ siteUrl: getPublicSiteUrl() });
}
