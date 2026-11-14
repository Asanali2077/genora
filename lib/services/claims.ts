import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/domain/profile";
import { analyzeClaims, type ReceiptRow } from "@/lib/engine/claims";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { TAX_YEAR } from "@/lib/engine/tax-2026";

export type StoredReceipt = ReceiptRow & { id: string; source: "manual" | "ai"; file_path: string | null; created_at: string };

export async function listReceipts(sb: SupabaseClient, householdId: string): Promise<StoredReceipt[]> {
  const { data } = await sb
    .from("receipts")
    .select("id, provider, category, amount, service_from, service_to, eligible, status, provider_tin_last4, source, file_path, created_at")
    .eq("household_id", householdId)
    .order("service_from", { ascending: false });
  return (data as StoredReceipt[]) ?? [];
}

/** The election the vault tracks: what the family actually elected, or the recommended one if they haven't yet. */
export function vaultElection(profile: Profile) {
  const current = profile.parents.reduce((s, p) => s + p.currentElection, 0);
  if (current > 0) return { election: current, recommended: false };
  return { election: analyzeBenefits(profile).optimal.election, recommended: true };
}

export function claimsSummary(profile: Profile, receipts: ReceiptRow[], today: string) {
  const { election, recommended } = vaultElection(profile);
  const cc = profile.childcare;
  const expectedAnnualCare = cc.daycare + cc.preschool + cc.after_school + cc.nanny + cc.day_camp;
  return {
    recommended,
    ...analyzeClaims({ election, expectedAnnualCare, receipts, planYear: TAX_YEAR, gracePeriod: profile.gracePeriod, today }),
  };
}
