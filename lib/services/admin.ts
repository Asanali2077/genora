import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";

export const ADMIN_COOKIE = "genora_admin";

export function adminToken(): string {
  return createHash("sha256").update(`genora-admin:${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  return (await cookies()).get(ADMIN_COOKIE)?.value === adminToken();
}

export const FUNNEL = [
  ["landing_view", "Landing"],
  ["quiz_start", "Started onboarding"],
  ["quiz_complete", "Finished onboarding"],
  ["savings_reveal_view", "Saw found money"],
  ["paywall_view", "Saw pricing"],
  ["checkout_start", "Started checkout"],
  ["purchase", "Paid"],
] as const;

/** Real funnel from the events table (distinct sessions per stage) plus product usage counts. */
export async function loadMetrics() {
  const sb = getAdminClient();
  if (!sb) return null;
  const [{ data: events }, households, subs, receipts, plans, breaks] = await Promise.all([
    sb.from("events").select("session_id, name").eq("is_seed", false).limit(50_000),
    sb.from("households").select("id", { count: "exact", head: true }),
    sb.from("subscriptions").select("price, plan_id").neq("status", "canceled"),
    sb.from("receipts").select("amount"),
    sb.from("benefit_plans").select("found_money").limit(10_000),
    sb.from("coverage_plans").select("id", { count: "exact", head: true }),
  ]);

  const sessions = new Map<string, Set<string>>();
  for (const e of events ?? []) {
    if (!sessions.has(e.name)) sessions.set(e.name, new Set());
    sessions.get(e.name)!.add(e.session_id);
  }
  const stages = FUNNEL.map(([key, label]) => ({ key, label, count: sessions.get(key)?.size ?? 0 }));
  const found = (plans.data ?? []).map((p) => Number(p.found_money));

  return {
    stages,
    households: households.count ?? 0,
    paying: subs.data?.length ?? 0,
    arr: Math.round((subs.data ?? []).reduce((s, x) => s + (x.plan_id === "annual" ? Number(x.price) : Number(x.price) * 12), 0)),
    receipts: receipts.data?.length ?? 0,
    receiptDollars: Math.round((receipts.data ?? []).reduce((s, r) => s + Number(r.amount), 0)),
    breakPlans: breaks.count ?? 0,
    avgFoundMoney: found.length ? Math.round(found.reduce((s, x) => s + x, 0) / found.length) : 0,
  };
}
