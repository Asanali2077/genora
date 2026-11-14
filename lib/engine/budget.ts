/**
 * Rules-aware family budget: a 12-month cash-flow forecast built from the household profile.
 * It layers what ordinary budgets miss — 2026 tax rules, benefit elections, school breaks, sick days,
 * holidays and each child's age milestones — onto take-home pay and regular bills. Pure and deterministic.
 */
import type { Profile } from "@/lib/domain/profile";
import type { Assignment } from "./coverage";
import { analyzeBenefits, stateRateFor } from "./benefits";
import { valueBenefits } from "./family";
import { FICA, STANDARD_DEDUCTION, TAX_YEAR, TRUMP_ACCOUNT, federalTaxOnAgi } from "./tax-2026";

export type Scenario = { incomeChangePct: number; careChangePct: number; extraSickDays: number; usePlan: boolean };
export const BASE_SCENARIO: Scenario = { incomeChangePct: 0, careChangePct: 0, extraSickDays: 0, usePlan: true };

export type LineKind = "income" | "benefit" | "tax" | "fixed" | "care" | "season" | "sick";
export type Line = { label: string; amount: number; kind: LineKind; note?: string };
export type Month = { ym: string; label: string; lines: Line[]; inflow: number; outflow: number; net: number; balance: number };
export type Effect = { title: string; detail: string; amount: number; when: string };
export type Forecast = {
  months: Month[];
  startBalance: number;
  endBalance: number;
  lowest: { ym: string; label: string; balance: number };
  shortfallMonths: number;
  bufferNeeded: number; // extra cash needed so the balance never drops below zero
  monthlyTakeHome: number;
  totals: Record<LineKind, number>;
  effects: Effect[];
  sickDaysExpected: number;
};

/** Sourced defaults offered in the UI (the family can change every one). */
export const DEFAULTS = {
  holidaysPerAdult: 890, // NRF 2025 holiday survey: $890.49 per person
  backToSchoolPerHousehold: 858, // NRF 2025 back-to-school survey: $858.07 per K-12 household
  sitterPerDay: 160,
  daysPerIllness: 2, // assumption: days a child stays home per illness
  // Illnesses per year by age (German birth-cohort study, via ParentData): 0–2: 3.4, 2–5: 2.6, 5–12: 1.0
  illnessesPerYear: (age: number) => (age < 2 ? 3.4 : age < 5 ? 2.6 : age < 13 ? 1 : 0),
  sources: {
    holidays: "https://cdn.nrf.com/media-center/press-releases/nrf-expects-holiday-sales-to-surpass-1-trillion-for-the-first-time-in-2025",
    backToSchool: "https://nrf.com/media-center/press-releases/back-to-school-season-begins-early-for-majority-of-shoppers",
    illness: "https://parentdata.org/how-often-kids-sick/",
  },
};

// Share of the year's sick days by calendar month (index 0 = January): heavier in the cold season.
const SICK_WEIGHTS = [0.2, 0.2, 0.15, 0.06, 0, 0, 0, 0, 0.06, 0.08, 0.1, 0.15];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const r = (n: number) => Math.round(n);

/** Yearly take-home pay before any benefit elections: gross − federal income tax − employee FICA − state estimate. */
export function takeHome(profile: Profile, incomeChangePct = 0) {
  const k = 1 + incomeChangePct / 100;
  const wages = profile.parents.map((p) => p.earnedIncome * k);
  const gross = wages.reduce((s, w) => s + w, 0) + profile.otherIncome;
  const federal = federalTaxOnAgi(gross, profile.filingStatus);
  const fica = wages.reduce((s, w) => s + Math.min(w, FICA.wageBase) * FICA.socialSecurityRate + w * FICA.medicareRate, 0);
  const state = Math.max(0, gross - STANDARD_DEDUCTION[profile.filingStatus]) * stateRateFor(profile.state);
  return { gross, federal, fica, state, net: gross - federal - fica - state };
}

export function forecastBudget(profile: Profile, opts: { today: string; coverage?: Assignment[]; ptoUsed?: Record<string, number>; scenario?: Scenario }): Forecast {
  const sc = opts.scenario ?? BASE_SCENARIO;
  const b = profile.budget;
  const careK = 1 + sc.careChangePct / 100;
  const scaled: Profile = {
    ...profile,
    parents: profile.parents.map((p) => ({ ...p, earnedIncome: p.earnedIncome * (1 + sc.incomeChangePct / 100) })),
    childcare: Object.fromEntries(Object.entries(profile.childcare).map(([k, v]) => [k, v * careK])) as Profile["childcare"],
  };
  const pay = takeHome(profile, sc.incomeChangePct);
  const benefits = analyzeBenefits(scaled);
  const plan = sc.usePlan ? benefits.optimal : benefits.current;
  const fsaSavingsYear = plan.federalSaved + plan.ficaSaved + plan.stateSaved - plan.forfeitLoss;
  const cc = scaled.childcare;

  const y0 = Number(opts.today.slice(0, 4));
  const m0 = Number(opts.today.slice(5, 7)) - 1;
  const ageIn = (birthYear: number, year: number) => year - birthYear;

  // Sick days: illnesses by age × days per illness, covered first by spare PTO and backup care, then a sitter.
  const kidsSick = profile.children.reduce((s, c) => s + DEFAULTS.illnessesPerYear(ageIn(c.birthYear, y0)) * DEFAULTS.daysPerIllness, 0);
  const sickDays = Math.round(kidsSick) + sc.extraSickDays;
  const working = profile.filingStatus === "mfj" ? profile.parents : profile.parents.slice(0, 1);
  const sparePto = working.reduce((s, p) => s + Math.max(0, p.ptoDays - (opts.ptoUsed?.[p.label] ?? 0) - 5), 0); // keep 5 days each
  const backupDays = valueBenefits(profile.employerBenefits, DEFAULTS.sitterPerDay).backupDays;
  const paidSickDays = Math.max(0, sickDays - sparePto - backupDays);
  const sickCostYear = paidSickDays * DEFAULTS.sitterPerDay;

  const months: Month[] = [];
  const totals: Record<LineKind, number> = { income: 0, benefit: 0, tax: 0, fixed: 0, care: 0, season: 0, sick: 0 };
  let balance = b.savings;
  const under5Now = profile.children.filter((c) => ageIn(c.birthYear, y0) < 5).length;
  const schoolAgeIn = (year: number) => profile.children.filter((c) => ageIn(c.birthYear, year) >= 5 && ageIn(c.birthYear, year) < 18).length;

  for (let i = 0; i < 12; i++) {
    const year = y0 + Math.floor((m0 + i) / 12);
    const mi = (m0 + i) % 12;
    const ym = `${year}-${String(mi + 1).padStart(2, "0")}`;
    const lines: Line[] = [];
    const add = (label: string, amount: number, kind: LineKind, note?: string) => {
      if (Math.abs(amount) >= 1) lines.push({ label, amount: r(amount), kind, note });
    };

    add("Take-home pay", pay.net / 12, "income", "After federal tax, Social Security, Medicare and state tax");
    add(sc.usePlan ? "Dependent Care FSA tax savings (Genora plan)" : "Dependent Care FSA tax savings", fsaSavingsYear / 12, "benefit", "Pre-tax childcare dollars: federal + FICA + state");
    if (mi === 3) {
      add("Child Tax Credit", benefits.childTaxCredit, "tax", "$2,200 per child under 17, at tax time");
      add("Child & dependent care credit", plan.careCredit, "tax", "Form 2441, at tax time");
    }

    add("Housing", -b.housing, "fixed");
    add("Groceries", -b.groceries, "fixed");
    add("Transport", -b.transport, "fixed");
    add("Utilities & phone", -b.utilities, "fixed");
    add("Insurance & health", -b.insurance, "fixed");
    add("Debt payments", -b.debt, "fixed");
    add("Everything else", -b.other, "fixed");

    // Childcare: daycare/preschool ends for a child who starts kindergarten (August of the year they turn 5).
    const startedSchool = profile.children.filter((c) => ageIn(c.birthYear, y0) < 5 && (year > c.birthYear + 5 || (year === c.birthYear + 5 && mi >= 7))).length;
    const daycareShare = under5Now > 0 ? (under5Now - startedSchool) / under5Now : 1;
    add("Daycare & preschool", (-(cc.daycare + cc.preschool) / 12) * daycareShare, "care", startedSchool > 0 ? "Lower: a child started kindergarten" : undefined);
    add("After-school care & sitter", -(cc.after_school + cc.nanny) / 12, "care");

    // School breaks: the family's own plan when a calendar exists, otherwise camps spread over summer.
    if (opts.coverage?.length) {
      const breakCost = opts.coverage.filter((a) => a.date.startsWith(ym)).reduce((s, a) => s + a.cost, 0) * careK;
      add("School-break care (your plan)", -breakCost, "care", "Camps and sitters on no-school days");
    } else if (mi >= 5 && mi <= 7) {
      add("Summer day camps", -cc.day_camp / 3, "care");
    }
    if (mi === 6) add("Overnight camp", -cc.overnight_camp, "care", "Not FSA-eligible");

    if (mi === 10) add("Winter holidays", -b.holidays * 0.35, "season", "Gifts, food and travel");
    if (mi === 11) add("Winter holidays", -b.holidays * 0.65, "season", "Gifts, food and travel");
    if (mi === 6) add("Summer vacation", -b.vacation, "season");
    if (mi === 7 && schoolAgeIn(year) > 0) add("Back to school", -b.backToSchool, "season", "Clothes, supplies, electronics");

    add("Sick-day care", -sickCostYear * SICK_WEIGHTS[mi], "sick", `${sickDays} sick days a year expected; PTO and backup care cover ${Math.min(sickDays, sparePto + backupDays)}`);

    const inflow = lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
    const outflow = -lines.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);
    for (const l of lines) totals[l.kind] += l.amount;
    balance += inflow - outflow;
    months.push({ ym, label: `${MONTH_NAMES[mi]} ${year}`, lines, inflow, outflow, net: inflow - outflow, balance: r(balance) });
  }

  const lowest = months.reduce((a, m) => (m.balance < a.balance ? m : a), months[0]);
  const effects: Effect[] = [];
  if (benefits.foundMoney > 0) effects.push({ title: "Dependent Care FSA plan", detail: `Electing ${plan.election ? `$${plan.election.toLocaleString("en-US")}` : "the right amount"} pre-tax adds money to every paycheck.`, amount: sc.usePlan ? benefits.foundMoney : -benefits.foundMoney, when: sc.usePlan ? "In your forecast" : "Missing from this forecast" });
  if (benefits.childTaxCredit > 0) effects.push({ title: "Child Tax Credit", detail: "$2,200 per child under 17 for 2026.", amount: benefits.childTaxCredit, when: "April" });
  for (const c of profile.children) {
    const name = c.name.trim() || "Your child";
    const kYear = c.birthYear + 5;
    if (ageIn(c.birthYear, y0) < 5 && (kYear === y0 || kYear === y0 + 1) && under5Now > 0) {
      const saved = (cc.daycare + cc.preschool) / under5Now / 12;
      effects.push({ title: `${name} starts kindergarten`, detail: "Daycare for this child ends; you can lower your FSA election within 30 days.", amount: r(saved), when: `From Aug ${kYear}, per month` });
    }
    if (c.birthYear + 13 === y0 + 1 || c.birthYear + 13 === y0) effects.push({ title: `${name} turns 13`, detail: "Care after the 13th birthday no longer counts for the FSA or the care credit.", amount: 0, when: String(c.birthYear + 13) });
    if (c.birthYear >= TRUMP_ACCOUNT.birthYears[0] && c.birthYear <= TRUMP_ACCOUNT.birthYears[1] && !profile.trumpAccountElected) effects.push({ title: `${name}: $1,000 Trump Account`, detail: "One-time federal deposit; elect it on Form 4547. It goes to the child's account, not your cash flow.", amount: TRUMP_ACCOUNT.deposit, when: "With your tax return" });
  }
  if (sickCostYear > 0) effects.push({ title: "Sick season", detail: `${sickDays} sick days expected; ${paidSickDays} need paid care after PTO and backup care.`, amount: -r(sickCostYear), when: "Mostly Dec–Mar" });
  if (backupDays > 0) effects.push({ title: "Employer backup care", detail: `${backupDays} subsidized days cover sick days and closures first.`, amount: r(Math.min(backupDays, sickDays) * DEFAULTS.sitterPerDay), when: "All year" });

  const minBalance = Math.min(...months.map((m) => m.balance));
  return {
    months,
    startBalance: r(b.savings),
    endBalance: months[11].balance,
    lowest: { ym: lowest.ym, label: lowest.label, balance: lowest.balance },
    shortfallMonths: months.filter((m) => m.balance < 0).length,
    bufferNeeded: Math.max(0, -minBalance),
    monthlyTakeHome: r(pay.net / 12),
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, r(v)])) as Record<LineKind, number>,
    effects,
    sickDaysExpected: sickDays,
  };
}

export const hasBudget = (profile: Profile) => {
  const b = profile.budget;
  return b.housing + b.groceries + b.transport + b.utilities + b.insurance + b.debt + b.other > 0;
};
export { TAX_YEAR };
