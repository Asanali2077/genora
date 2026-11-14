import { z } from "zod";
import { pricing } from "@/config/site";
import { getUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getHousehold, isSubscribed } from "@/lib/services/household";

const Body = z.object({ planId: z.enum(pricing.plans.map((p) => p.id) as [string, ...string[]]) });

/**
 * Demo checkout: no card is charged. The subscription row is written with the service role
 * (clients cannot insert subscriptions under RLS) and marked source = 'mock'. A real provider
 * (e.g. Stripe test mode) would replace only this handler.
 */
export async function POST(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return Response.json({ error: "Build your family plan first.", next: "/start" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a plan." }, { status: 400 });
  if (await isSubscribed(sb, household.id)) return Response.json({ ok: true });

  const plan = pricing.plans.find((p) => p.id === parsed.data.planId)!;
  const admin = getAdminClient();
  if (!admin) return Response.json({ error: "Checkout is unavailable right now." }, { status: 503 });
  const { error } = await admin.from("subscriptions").insert({ household_id: household.id, plan_id: plan.id, status: "active", price: plan.price, source: "mock" });
  if (error) {
    console.error("[checkout] insert failed", error.message);
    return Response.json({ error: "We couldn't start your plan. Try again." }, { status: 500 });
  }
  await admin.from("events").insert({ session_id: user.id, household_id: household.id, name: "purchase", props: { plan: plan.id, price: plan.price } });
  return Response.json({ ok: true });
}
