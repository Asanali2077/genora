/**
 * Year-round family logic: life events tied to each child's age, the "care SOS" options when a kid is sick
 * or school is closed, and the running total of what Genora found. Pure and deterministic.
 */
import type { EmployerBenefit, Profile } from "@/lib/domain/profile";
import { DCFSA_HOUSEHOLD_LIMIT, TAX_YEAR } from "./tax-2026";

export type LifeEvent = { date: string; title: string; detail: string; kind: "child" | "deadline" | "enrollment" };

/** Dated reminders that follow from the family's own data. Birthdays are unknown, so age events use Jan 1 of the year. */
export function lifeEvents(profile: Profile, today: string, opts: { gracePeriod?: boolean } = {}): LifeEvent[] {
  const out: LifeEvent[] = [];
  const year = Number(today.slice(0, 4));
  profile.children.forEach((c, i) => {
    const name = c.name.trim() || `Child ${i + 1}`;
    const turns13 = c.birthYear + 13;
    if (turns13 >= year && turns13 <= year + 6) {
      out.push({ date: `${turns13}-01-01`, title: `${name} turns 13 in ${turns13}`, detail: "Care after their 13th birthday no longer counts for the FSA or the care credit. Lower your election for that year.", kind: "child" });
    }
    const school = c.birthYear + 5;
    if (school >= year && school <= year + 2) {
      out.push({ date: `${school}-08-15`, title: `${name} starts kindergarten`, detail: "Fewer daycare hours is a qualifying change: you can lower your FSA election within 30 days (Reg. 1.125-4(f)).", kind: "child" });
    }
    const turns17 = c.birthYear + 17;
    if (turns17 >= year && turns17 <= year + 6) {
      out.push({ date: `${turns17}-01-01`, title: `${name} ages out of the Child Tax Credit`, detail: `${turns17} is the first tax year without the $2,200 credit for ${name}.`, kind: "child" });
    }
  });
  out.push({ date: `${TAX_YEAR}-12-31`, title: "Last day of the FSA plan year", detail: "Childcare you pay for after today counts toward next year's election.", kind: "deadline" });
  if (opts.gracePeriod) out.push({ date: `${TAX_YEAR + 1}-03-15`, title: "Grace period ends", detail: "Last day to use this year's FSA money on care.", kind: "deadline" });
  if (today.slice(5, 7) >= "10") out.push({ date: `${year}-12-01`, title: "Open enrollment season", detail: `Elect next year's Dependent Care FSA (household limit $${DCFSA_HOUSEHOLD_LIMIT.toLocaleString("en-US")}).`, kind: "enrollment" });
  return out.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

export type CareOption = { id: string; title: string; detail: string; cashCost: number; afterTaxCost: number; available: boolean; badge?: string };

/** Ranked options for an unexpected day without care (sick child, closed school or daycare). */
export function careOptions(input: {
  days: number;
  kids: number;
  parents: { label: string; ptoLeft: number }[];
  backupCareDaysLeft: number;
  sitterPerDay: number;
  combinedTaxRate: number;
  fsaRoomLeft: number;
}): CareOption[] {
  const { days, parents, sitterPerDay } = input;
  const opts: CareOption[] = [];
  for (const p of parents) {
    opts.push({
      id: `pto-${p.label}`,
      title: `${p.label === "You" ? "You take" : `${p.label} takes`} ${days === 1 ? "the day" : `${days} days`} off`,
      detail: p.ptoLeft >= days ? `${p.ptoLeft} PTO days left this year, ${p.ptoLeft - days} after this.` : `Only ${p.ptoLeft} PTO days left.`,
      cashCost: 0,
      afterTaxCost: 0,
      available: p.ptoLeft >= days,
    });
  }
  opts.push({
    id: "backup",
    title: "Use employer backup care",
    detail: input.backupCareDaysLeft >= days ? `${input.backupCareDaysLeft} subsidized backup-care days left. Book early: centers fill up on sick-season mornings.` : "No backup-care days found. Scan your benefits guide to check.",
    cashCost: 0,
    afterTaxCost: 0,
    available: input.backupCareDaysLeft >= days,
    badge: "Often unused",
  });
  const cash = sitterPerDay * days;
  const viaFsa = Math.min(cash, Math.max(0, input.fsaRoomLeft));
  opts.push({
    id: "sitter",
    title: "Book a sitter",
    detail: viaFsa > 0 ? `Pay through your Dependent Care FSA: ${Math.round(input.combinedTaxRate * 100)}% of it comes back as tax savings. Keep the receipt.` : "FSA room is used up, so this is paid with after-tax money.",
    cashCost: cash,
    afterTaxCost: Math.round(cash - viaFsa * input.combinedTaxRate),
    available: true,
  });
  // Free options first (PTO/backup care), then by after-tax cost.
  return opts.sort((a, b) => Number(b.available) - Number(a.available) || a.afterTaxCost - b.afterTaxCost);
}

export type Savings = { total: number; parts: { label: string; amount: number }[]; roi: number };

/** "Genora found you $X this year": only money that would not have happened without the plan. */
export function savingsSummary(parts: { label: string; amount: number }[], planPrice: number): Savings {
  const clean = parts.filter((p) => p.amount > 0).map((p) => ({ ...p, amount: Math.round(p.amount) }));
  const total = clean.reduce((s, p) => s + p.amount, 0);
  return { total, parts: clean, roi: planPrice > 0 ? Math.floor(total / planPrice) : 0 };
}

/** Dollar value of benefits found in an employer guide: backup-care days at the local sitter rate, cash benefits at face value. */
export function valueBenefits(benefits: EmployerBenefit[], sitterPerDay: number) {
  const rows = benefits.map((b) => {
    const value = b.kind === "backup_care" ? (b.days ?? 0) * sitterPerDay : b.kind === "childcare_subsidy" || b.kind === "dcfsa_contribution" ? b.amount ?? 0 : 0;
    return { ...b, value: Math.round(value) };
  });
  return { rows, total: rows.reduce((s, r) => s + r.value, 0), backupDays: rows.filter((r) => r.kind === "backup_care").reduce((s, r) => s + (r.days ?? 0), 0) };
}
