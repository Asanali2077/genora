import { z } from "zod";
import type { Locale } from "../app.config";

/** Схема результата AI. Меняется командой /adapt-case вместе с промптом и mock. */
export const AnalyzeResultSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).min(2).max(4),
  risks: z.array(z.string()).min(1).max(3),
  plan: z
    .array(
      z.object({
        day: z.number().int().min(1).max(14),
        title: z.string(),
        action: z.string(),
        minutes: z.number().int().min(1).max(60),
        premium: z.boolean(),
      }),
    )
    .min(5)
    .max(14),
  premiumTeaser: z.string(),
});
export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

export const analyzePrompt = {
  system: (locale: Locale) =>
    [
      "You are Lumi, a warm, concise habit coach. You design realistic micro-habit plans.",
      "Rules: every action ≤ the user's available minutes; no guilt; concrete verbs; no medical claims.",
      `Write ALL text fields in ${locale === "ru" ? "Russian" : "English"}.`,
      "Respond with ONE JSON object only, no markdown, matching this shape:",
      '{"headline":str,"summary":str,"score":0-100 int (habit readiness),"strengths":[2-4 str],"risks":[1-3 str],',
      '"plan":[{"day":1-14,"title":str,"action":str,"minutes":int,"premium":bool}] (7-14 items, first 3 days premium=false, rest premium=true),',
      '"premiumTeaser":str}',
    ].join("\n"),
  user: (answers: Record<string, unknown>) =>
    `Quiz answers (JSON, ids are stable keys):\n${JSON.stringify(answers, null, 2)}\nBuild the plan.`,
};
