import { NextResponse } from "next/server";
import { callClaudeText, isClaudeConfigured } from "@/lib/claude";
import { generateMotivationalQuotePrompt } from "@/lib/prompts";
import {
  getOrCreateAppUserId,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

const FALLBACKS = [
  "Tiny daily wins compound into a different person in 30 days.",
  "You already gave the exam once — you're not starting from zero today.",
  "The 15% you fix this week is the 15% that earns the seat.",
  "Show up like a doctor — quiet, prepared, and unshakable.",
  "Discipline doesn't feel motivating. Results do.",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const day = Number(url.searchParams.get("day") ?? "1") || 1;

  let name = "there";
  if (isSupabaseConfigured()) {
    try {
      const userId = await getOrCreateAppUserId();
      if (userId) {
        const service = getServiceClient();
        const { data } = await service
          .from("users")
          .select("name")
          .eq("id", userId)
          .maybeSingle();
        if (data?.name) name = data.name;
      }
    } catch {
      /* ignore */
    }
  }

  if (!isClaudeConfigured()) {
    return NextResponse.json({ quote: FALLBACKS[day % FALLBACKS.length] });
  }

  try {
    const quote = await callClaudeText({
      prompt: generateMotivationalQuotePrompt({ name, dayNumber: day }),
      maxTokens: 80,
    });
    return NextResponse.json({ quote: stripQuotes(quote) });
  } catch {
    return NextResponse.json({ quote: FALLBACKS[day % FALLBACKS.length] });
  }
}

function stripQuotes(s: string) {
  return s.replace(/^["“'`]+|["”'`]+$/g, "").trim();
}
