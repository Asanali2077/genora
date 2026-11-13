import { z } from "zod";
import { paywallConfig } from "@/config/paywall.config";
import { saveSubscription, trackEvent } from "@/lib/store";

const Body = z.object({ sessionId: z.string().min(1).max(100), planId: z.string(), variant: z.enum(["a", "b"]).default("a") });

/** Mock-checkout: деньги не списываются. Цена и триал берутся из конфига, а не от клиента. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const { sessionId, planId, variant } = parsed.data;
  const plan = paywallConfig.plans.find((p) => p.id === planId);
  if (!plan) return Response.json({ ok: false, error: "unknown_plan" }, { status: 400 });

  await saveSubscription({ session_id: sessionId, plan_id: plan.id, status: plan.trialDays > 0 ? "trialing" : "active", price: plan.price, variant });
  await trackEvent({ session_id: sessionId, name: "purchase", props: { plan: plan.id, price: plan.price }, variant });
  return Response.json({ ok: true, premium: true });
}
