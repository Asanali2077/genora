import "server-only";
import type { z } from "zod";
import { anthropicProvider, geminiProvider, type Provider } from "./providers";

/**
 * AI layer: "AI extracts, rules compute". AI only turns messy inputs (school calendars, receipts) into
 * structured data; every money number is computed by lib/engine. Each call is schema-validated,
 * time-limited, retried once, and falls back to a manual path instead of inventing data.
 */

const providers: Record<string, Provider | undefined> = { gemini: geminiProvider, anthropic: anthropicProvider };

export type AiOutcome<T> = { ok: true; data: T; provider: string } | { ok: false; reason: "not_configured" | "failed" };

export function aiProviderName(): string {
  return process.env.AI_PROVIDER || "gemini";
}

export function isAiConfigured(): boolean {
  const name = aiProviderName();
  if (name === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  if (name === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ALLOW_PAID_AI === "true";
  return false;
}

function extractJson(text: string): unknown {
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (start < 0 || end <= start) throw new Error("no JSON in response");
  return JSON.parse(text.slice(start, end + 1));
}

export async function callStructured<T>(opts: { schema: z.ZodType<T>; system: string; user: string; imageDataUrl?: string }): Promise<AiOutcome<T>> {
  const name = aiProviderName();
  const provider = providers[name];
  if (!provider || !isAiConfigured()) return { ok: false, reason: "not_configured" };

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 30_000;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await provider({ system: opts.system, user: opts.user, imageDataUrl: opts.imageDataUrl, timeoutMs });
      return { ok: true, data: opts.schema.parse(extractJson(text)), provider: name };
    } catch (err) {
      console.error(`[ai] ${name} attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return { ok: false, reason: "failed" };
}
