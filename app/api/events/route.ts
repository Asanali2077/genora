import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  sessionId: z.string().min(1).max(100),
  name: z.string().regex(/^[a-z_]{2,48}$/),
  props: z.record(z.string(), z.unknown()).default({}),
  variant: z.enum(["a", "b"]).nullish(),
});

/** Funnel analytics. Writes with the service role; clients have no direct access to `events`. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const { sessionId, name, props, variant } = parsed.data;
  try {
    await getAdminClient()?.from("events").insert({ session_id: sessionId, name, props, variant: variant ?? null });
  } catch {
    // analytics must never break the product
  }
  return Response.json({ ok: true });
}
