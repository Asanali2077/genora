import "server-only";
import type { z } from "zod";
import { analyzeMock, analyzePrompt, AnalyzeResultSchema, type AnalyzeResult, type Locale } from "@/config";
import { anthropicProvider, geminiProvider, type Provider } from "./providers";

export type AnalyzeOutcome = { result: AnalyzeResult; provider: string; fallback: boolean };

const providers: Record<string, Provider | undefined> = { anthropic: anthropicProvider, gemini: geminiProvider };

/** Достаём JSON-объект из ответа модели (на случай ```json-обёрток и лишнего текста). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON in response");
  return JSON.parse(text.slice(start, end + 1));
}

/** Общий AI-вызов по правилам проекта: Zod-схема, таймаут, 1 retry, mock-fallback. */
export async function callStructured<T>(opts: {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  imageDataUrl?: string;
  mock: () => T;
}): Promise<{ data: T; provider: string; fallback: boolean }> {
  const name = process.env.AI_PROVIDER || "anthropic";
  const demo = process.env.DEMO_MODE === "true" || name === "mock";
  const provider = providers[name];
  if (demo || !provider) return { data: opts.mock(), provider: "mock", fallback: !demo };

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 45000;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await provider({ system: opts.system, user: opts.user, imageDataUrl: opts.imageDataUrl, timeoutMs });
      return { data: opts.schema.parse(extractJson(text)), provider: name, fallback: false };
    } catch (err) {
      console.error(`[ai] ${name} attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return { data: opts.mock(), provider: "mock", fallback: true };
}

export async function runAnalysis(input: { locale: Locale; answers: Record<string, unknown>; photo?: string }): Promise<AnalyzeOutcome> {
  const { data, provider, fallback } = await callStructured({
    schema: AnalyzeResultSchema,
    system: analyzePrompt.system(input.locale),
    user: analyzePrompt.user(input.answers),
    imageDataUrl: input.photo,
    mock: () => analyzeMock[input.locale],
  });
  return { result: data, provider, fallback };
}
