import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ProfileSchema, type Profile } from "@/lib/domain/profile";
import { analyzeBenefits, type BenefitsResult } from "@/lib/engine/benefits";
import { ENGINE_VERSION } from "@/lib/engine/tax-2026";

export type Household = { id: string; name: string; profile: Profile };
export type SavedPlan = { id: string; result: BenefitsResult; found_money: number; created_at: string };

/** The household the signed-in user belongs to (RLS limits the query to their own). */
export async function getHousehold(sb: SupabaseClient, userId: string): Promise<Household | null> {
  const { data: m } = await sb.from("household_members").select("household_id").eq("user_id", userId).limit(1).maybeSingle();
  if (!m) return null;
  const { data } = await sb.from("households").select("id, name, profile").eq("id", m.household_id).maybeSingle();
  if (!data) return null;
  const parsed = ProfileSchema.safeParse(data.profile);
  return parsed.success ? { id: data.id, name: data.name, profile: parsed.data } : null;
}

export async function getLatestPlan(sb: SupabaseClient, householdId: string): Promise<SavedPlan | null> {
  const { data } = await sb
    .from("benefit_plans")
    .select("id, result, found_money, created_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SavedPlan) ?? null;
}

/** Creates or updates the user's household profile, reruns the engine and stores a plan snapshot. */
export async function saveProfileAndPlan(sb: SupabaseClient, userId: string, profile: Profile) {
  const existing = await getHousehold(sb, userId);
  let householdId = existing?.id;
  if (householdId) {
    const { error } = await sb.from("households").update({ profile }).eq("id", householdId);
    if (error) throw error;
  } else {
    // The id is generated here: RLS only lets members read a household, and membership is added by a trigger
    // after the insert, so `insert … returning` would be rejected.
    householdId = crypto.randomUUID();
    const { error } = await sb.from("households").insert({ id: householdId, owner_id: userId, profile });
    if (error) throw error;
  }

  const result = analyzeBenefits(profile);
  const { error } = await sb.from("benefit_plans").insert({
    household_id: householdId,
    engine_version: ENGINE_VERSION,
    inputs: profile,
    result,
    found_money: result.foundMoney,
  });
  if (error) throw error;
  return { householdId, result };
}

export async function isSubscribed(sb: SupabaseClient, householdId: string): Promise<boolean> {
  const { data } = await sb.from("subscriptions").select("id").eq("household_id", householdId).neq("status", "canceled").limit(1);
  return Boolean(data?.length);
}
