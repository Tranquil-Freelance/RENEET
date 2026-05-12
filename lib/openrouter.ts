/**
 * Minimal OpenRouter client. OpenRouter exposes an OpenAI-compatible
 * /chat/completions endpoint, so we don't need any SDK — a single fetch call
 * is enough and keeps the bundle small.
 *
 * Default model: openai/gpt-4o-mini (fast + cheap, JSON-mode capable).
 * Override via OPENROUTER_MODEL if you want a different one.
 */

import { getPublicSiteUrl } from "@/lib/site-url";

const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const APP_URL = getPublicSiteUrl();
const SITE_NAME = "PrepInsights";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export function isAiConfigured(): boolean {
  return Boolean(API_KEY);
}

interface JsonCallOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  retries?: number;
  /** Lower = more deterministic. 0.2 keeps quantitative analysis stable. */
  temperature?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface ChatResponse {
  id: string;
  choices: ChatChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

async function callChat(args: {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  jsonMode: boolean;
}): Promise<string> {
  if (!API_KEY) {
    throw new Error("OPENROUTER_API_KEY missing. Set it in .env.local.");
  }
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: args.messages,
    max_tokens: args.maxTokens,
    temperature: args.temperature,
  };
  if (args.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": APP_URL,
      "X-Title": SITE_NAME,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter ${res.status} ${res.statusText}: ${text.slice(0, 400)}`,
    );
  }
  const data = (await res.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }
  return content;
}

/**
 * Call OpenRouter expecting a single JSON object. Uses native JSON-mode where
 * the model supports it; otherwise falls back to a tolerant extractor that
 * strips markdown fences and locates the outermost {...} block.
 */
export async function callAiJson<T>({
  prompt,
  systemPrompt,
  maxTokens = 4096,
  retries = 2,
  temperature = 0.3,
}: JsonCallOptions): Promise<T> {
  const baseSystem =
    systemPrompt ??
    "You are an expert NEET-UG exam analyst. Respond with a single valid JSON object only — no preamble, no markdown.";

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const text = await callChat({
        messages: [
          { role: "system", content: baseSystem },
          { role: "user", content: prompt },
        ],
        maxTokens,
        temperature,
        jsonMode: true,
      });
      const parsed = extractJson<T>(text);
      if (parsed) return parsed;
      throw new Error("OpenRouter did not return parseable JSON");
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("OpenRouter call failed");
}

export async function callAiText({
  prompt,
  systemPrompt,
  maxTokens = 256,
  temperature = 0.6,
}: JsonCallOptions): Promise<string> {
  return (
    await callChat({
      messages: [
        {
          role: "system",
          content: systemPrompt ?? "You are a helpful, concise assistant.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens,
      temperature,
      jsonMode: false,
    })
  ).trim();
}

function extractJson<T>(text: string): T | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
