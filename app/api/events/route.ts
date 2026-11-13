import { z } from "zod";
import { trackEvent } from "@/lib/store";

const Body = z.object({
  sessionId: z.string().min(1).max(100),
  name: z.string().min(1).max(64),
  props: z.record(z.string(), z.unknown()).default({}),
  variant: z.enum(["a", "b"]).nullish(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const { sessionId, name, props, variant } = parsed.data;
  await trackEvent({ session_id: sessionId, name, props, variant: variant ?? null });
  return Response.json({ ok: true });
}
