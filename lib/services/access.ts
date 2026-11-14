import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ProfileSchema } from "@/lib/domain/profile";
import type { Household } from "./household";

/**
 * Loads the signed-in household and its subscription in one query (RLS limits it to the user's own),
 * cached per request so the app layout and the page share it. Visitors without a household go to onboarding.
 */
export const requireHousehold = cache(async () => {
  const { sb, user } = await getUser();
  if (!user) redirect("/start");
  const { data: m } = await sb
    .from("household_members")
    .select("household_id, households(id, name, profile, subscriptions(status))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const h = (m as unknown as { households: { id: string; name: string; profile: unknown; subscriptions: { status: string }[] } | null } | null)?.households;
  const profile = ProfileSchema.safeParse(h?.profile);
  if (!h || !profile.success) redirect("/start");
  const household: Household = { id: h.id, name: h.name, profile: profile.data };
  const pro = (h.subscriptions ?? []).some((s) => s.status !== "canceled");
  return { sb, user, household, pro };
});