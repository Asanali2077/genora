import { isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Проверка живости перед демо: режим, AI-провайдер, наличие БД. Секреты не раскрываем. */
export async function GET() {
  const demo = process.env.DEMO_MODE === "true";
  const provider = process.env.AI_PROVIDER || "anthropic";
  const keyOk = provider === "mock" || (provider === "anthropic" ? Boolean(process.env.ANTHROPIC_API_KEY) : Boolean(process.env.GEMINI_API_KEY));
  return Response.json({
    ok: true,
    demoMode: demo,
    ai: { provider: demo ? "mock" : provider, ready: demo || keyOk, model: process.env.AI_MODEL || "claude-sonnet-5-5" },
    db: { supabase: isSupabaseConfigured() ? "configured" : "memory-fallback" },
    time: new Date().toISOString(),
  });
}
