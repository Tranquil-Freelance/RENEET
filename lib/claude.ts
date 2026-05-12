import Anthropic from "@anthropic-ai/sdk";

const API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!API_KEY) {
    throw new Error("ANTHROPIC_API_KEY missing. Set it in .env.local.");
  }
  if (!client) client = new Anthropic({ apiKey: API_KEY });
  return client;
}

export function isClaudeConfigured() {
  return Boolean(API_KEY);
}

interface JsonCallOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  retries?: number;
}

/**
 * Calls Claude expecting a single JSON object back. Extracts the first
 * {...} block from the response to be tolerant of preamble/postscript text.
 */
export async function callClaudeJson<T>({
  prompt,
  systemPrompt,
  maxTokens = 8192,
  retries = 2,
}: JsonCallOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await getClient().messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system:
          systemPrompt ??
          "You are an expert NEET-UG exam analyst. Always respond with a single valid JSON object and nothing else.",
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((b) => b.text)
        .join("\n");

      const parsed = extractJson<T>(text);
      if (parsed) return parsed;
      throw new Error("Claude did not return parseable JSON");
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Claude call failed");
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

export async function callClaudeText({
  prompt,
  systemPrompt,
  maxTokens = 512,
}: JsonCallOptions): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt ?? "You are a helpful, concise assistant.",
    messages: [{ role: "user", content: prompt }],
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
