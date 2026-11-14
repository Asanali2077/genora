import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Profile } from "@/lib/domain/profile";
import { planCoverage, type Closure, type CoverageResult } from "@/lib/engine/coverage";
import { FICA, TAX_YEAR, marginalRate } from "@/lib/engine/tax-2026";
import { stateRateFor } from "@/lib/engine/benefits";

export const CoverageSettingsSchema = z.object({
  campPerKidPerDay: z.number().min(0).max(1_000).default(60),
  sitterPerDay: z.number().min(0).max(2_000).default(160),
  ptoReserve: z.number().int().min(0).max(30).default(5),
  summerWeeks: z.number().int().min(0).max(14).default(10),
});
export type CoverageSettings = z.infer<typeof CoverageSettingsSchema>;

const addDays = (iso: string, n: number) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * 86_400_000).toISOString().slice(0, 10);

/** Adds the summer after the last day of school as one closure. */
export function withSummer(closures: Closure[], lastDay: string | null, summerWeeks: number): Closure[] {
  if (!lastDay || summerWeeks === 0) return closures;
  return [...closures, { start: addDays(lastDay, 1), end: addDays(lastDay, summerWeeks * 7), label: "Summer break" }];
}

export function computeCoverage(profile: Profile, closures: Closure[], settings: CoverageSettings, today: string): CoverageResult {
  const kidsInCare = profile.children.filter((c) => TAX_YEAR - c.birthYear < 13).length;
  const agi = profile.parents.reduce((s, p) => s + p.earnedIncome, 0) + profile.otherIncome;
  const working = profile.filingStatus === "mfj" ? profile.parents : profile.parents.slice(0, 1);
  return planCoverage({
    closures,
    parents: working.map((p) => ({ label: p.label, ptoDays: p.ptoDays })),
    kidsInCare,
    campPerKidPerDay: settings.campPerKidPerDay,
    sitterPerDay: settings.sitterPerDay,
    ptoReserve: settings.ptoReserve,
    campMinDays: 3,
    combinedTaxRate: marginalRate(agi, profile.filingStatus) + FICA.socialSecurityRate + FICA.medicareRate + stateRateFor(profile.state),
    fromDate: today,
  });
}

export async function saveCalendarAndPlan(
  sb: SupabaseClient,
  householdId: string,
  schoolYear: string,
  rawText: string | null,
  closures: Closure[],
  result: CoverageResult,
) {
  const cal = await sb
    .from("school_calendars")
    .upsert({ household_id: householdId, school_year: schoolYear, raw_text: rawText, days: closures }, { onConflict: "household_id,school_year" });
  if (cal.error) throw cal.error;
  const plan = await sb.from("coverage_plans").insert({ household_id: householdId, school_year: schoolYear, result, gap_budget: result.cashCost });
  if (plan.error) throw plan.error;
}

export async function getLatestCoverage(sb: SupabaseClient, householdId: string) {
  const { data: cal } = await sb.from("school_calendars").select("school_year, raw_text, days").eq("household_id", householdId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: plan } = await sb.from("coverage_plans").select("result, created_at").eq("household_id", householdId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return { calendar: cal as { school_year: string; raw_text: string | null; days: Closure[] } | null, result: (plan?.result as CoverageResult) ?? null };
}
