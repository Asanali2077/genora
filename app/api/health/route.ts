import { aiProviderName, isAiConfigured } from "@/lib/ai";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { ENGINE_VERSION, TAX_YEAR } from "@/lib/engine/tax-2026";

export const dynamic = "force-dynamic";

/** Pre-demo check: engine version, database reachability and AI readiness. Never exposes secrets. */
export async function GET() {
  let db: "ok" | "unreachable" | "not_configured" = "not_configured";
  if (isSupabaseConfigured()) {
    const { error } = (await getAdminClient()?.from("households").select("id", { head: true, count: "exact" })) ?? { error: true };
    db = error ? "unreachable" : "ok";
  }
  const ai = { provider: aiProviderName(), ready: isAiConfigured(), model: aiProviderName() === "gemini" ? process.env.GEMINI_MODEL || "gemini-3-flash-preview" : null };
  return Response.json({ ok: db === "ok", engine: { version: ENGINE_VERSION, taxYear: TAX_YEAR }, db, ai, time: new Date().toISOString() }, { status: db === "ok" ? 200 : 503 });
}
