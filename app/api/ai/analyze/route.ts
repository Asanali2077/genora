import { z } from "zod";
import { LOCALES } from "@/config/app.config";
import { runAnalysis } from "@/lib/ai";
import { saveResult, trackEvent } from "@/lib/store";

export const maxDuration = 60;

const Body = z.object({
  sessionId: z.string().min(1).max(100),
  locale: z.enum(LOCALES),
  answers: z.record(z.string(), z.unknown()),
  photo: z.string().max(4_000_000).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { sessionId, locale, answers, photo } = parsed.data;

  const { result, provider, fallback } = await runAnalysis({ locale, answers, photo });
  const shareId = await saveResult(sessionId, result, locale, provider);
  await trackEvent({ session_id: sessionId, name: "ai_result", props: { provider, fallback } });
  return Response.json({ shareId, result, provider, fallback, locale });
}
