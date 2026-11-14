import type { Profile } from "@/lib/domain/profile";
import {
  CDCC,
  CTC,
  DCFSA_HOUSEHOLD_LIMIT,
  ENGINE_VERSION,
  SOURCES,
  STATE_RATES,
  STATE_RATE_DEFAULT,
  TAX_YEAR,
  TRUMP_ACCOUNT,
  careCreditRate,
  federalTaxOnAgi,
  ficaSaved,
  marginalRate,
} from "./tax-2026";

/**
 * Benefits Stack Optimizer.
 * Decides how much each parent should elect in the Dependent Care FSA, what remains for the
 * Child and Dependent Care Credit, and what else the family is entitled to. Pure and deterministic.
 */

export type Allocation = { parent: string; election: number };
export type Scenario = {
  election: number;
  allocation: Allocation[];
  federalSaved: number;
  ficaSaved: number;
  stateSaved: number;
  careCredit: number;
  careCreditRate: number;
  forfeitLoss: number;
  total: number;
};
export type MathLine = { label: string; value: number; formula: string; source?: string };
export type Action = { id: string; title: string; detail: string; impact: number; when: string };
export type Warning = { id: string; message: string; amount?: number };

export type BenefitsResult = {
  engineVersion: string;
  taxYear: number;
  agi: number;
  careChildren: number;
  ctcChildren: number;
  eligibleExpenses: number;
  excludedExpenses: number;
  dcfsaHeadroom: number;
  current: Scenario;
  optimal: Scenario;
  foundMoney: number;
  /** Money back at each FSA election the optimizer tested (sampled every ) — the shape of the decision. */
  curve: { election: number; total: number }[];
  scenariosTested: number;
  childTaxCredit: number;
  oneTimeExtras: { id: string; label: string; amount: number }[];
  actions: Action[];
  warnings: Warning[];
  math: MathLine[];
};

const round = (n: number) => Math.round(n);

/** "You" → "your", "Sam" → "Sam's". */
export const possessive = (label: string) => (label.toLowerCase() === "you" ? "your" : `${label}'s`);

function ageAtYearEnd(birthYear: number) {
  return TAX_YEAR - birthYear;
}

export function stateRateFor(state: string) {
  return STATE_RATES[state.toUpperCase()] ?? STATE_RATE_DEFAULT;
}

/** Splits a household election between parents: those whose employer offers a DCFSA, cheapest FICA first. */
export function allocateElection(profile: Profile, election: number): Allocation[] {
  const offering = profile.parents
    .filter((p) => p.employerOffersDcfsa)
    // Parents under the Social Security wage base save 7.65% FICA instead of 1.45%: fill them first.
    .sort((a, b) => ficaSaved(1_000, b.earnedIncome) - ficaSaved(1_000, a.earnedIncome));
  let left = election;
  return offering.map((p) => {
    const take = Math.min(left, p.earnedIncome, DCFSA_HOUSEHOLD_LIMIT);
    left -= take;
    return { parent: p.label, election: take };
  });
}

type Ctx = {
  profile: Profile;
  agi: number;
  eligible: number;
  lowerEarned: number;
  capByKids: number;
  backup: number;
  stateRate: number;
  headroom: number; // tax-free FSA room: min($7,500, lower earner) − backup care
};

function evaluate(ctx: Ctx, election: number): Scenario {
  const { profile, agi, eligible, lowerEarned, capByKids, backup, stateRate, headroom } = ctx;
  const status = profile.filingStatus;
  const allocation = allocateElection(profile, election);
  const allocated = allocation.reduce((s, a) => s + a.election, 0);

  // Above the household limit, FSA dollars are taxable wages: no tax saving, but the money is not lost.
  const taxFreeShare = allocated > 0 ? Math.min(1, headroom / allocated) : 1;
  const taxFree = allocated * taxFreeShare;
  // Election above the childcare actually paid can't be reimbursed and is forfeited.
  const reimbursable = Math.min(allocated, Math.max(0, eligible - backup));
  const forfeited = allocated - reimbursable;

  const federalSaved = federalTaxOnAgi(agi, status) - federalTaxOnAgi(agi - taxFree, status);
  const fica = allocation.reduce((s, a) => {
    const p = profile.parents.find((x) => x.label === a.parent)!;
    return s + ficaSaved(a.election * taxFreeShare, p.earnedIncome);
  }, 0);
  const stateSaved = taxFree * stateRate;

  const excluded = Math.min(taxFree, reimbursable) + backup;
  const creditBase = Math.max(0, Math.min(capByKids, eligible, lowerEarned) - excluded);
  const rate = careCreditRate(agi - taxFree, status);
  const careCredit = ctx.capByKids > 0 ? creditBase * rate : 0;

  // Forfeited dollars were taken from the paycheck: the family loses them (net of the taxes they avoided).
  const forfeitLoss = forfeited;
  const total = federalSaved + fica + stateSaved + careCredit - forfeitLoss;

  return {
    election: allocated,
    allocation,
    federalSaved: round(federalSaved),
    ficaSaved: round(fica),
    stateSaved: round(stateSaved),
    careCredit: round(careCredit),
    careCreditRate: rate,
    forfeitLoss: round(forfeitLoss),
    total: round(total),
  };
}

export function analyzeBenefits(profile: Profile): BenefitsResult {
  const status = profile.filingStatus;
  const earned = profile.parents.map((p) => p.earnedIncome);
  const agi = earned.reduce((s, x) => s + x, 0) + profile.otherIncome;
  // Married filing jointly with one parent listed: the other spouse is treated as not earning (benefits limited to $0).
  const lowerEarned = status === "mfj" && profile.parents.length === 2 ? Math.min(...earned) : status === "mfj" ? 0 : earned[0];

  const careChildren = profile.children.filter((c) => ageAtYearEnd(c.birthYear) < CDCC.childAgeLimit).length;
  const ctcChildren = profile.children.filter((c) => ageAtYearEnd(c.birthYear) < CTC.childAgeLimit).length;

  const cc = profile.childcare;
  const excludedExpenses = cc.overnight_camp;
  const eligible = careChildren > 0 ? cc.daycare + cc.preschool + cc.after_school + cc.nanny + cc.day_camp : 0;
  const capByKids = careChildren === 0 ? 0 : careChildren === 1 ? CDCC.expenseCapOneChild : CDCC.expenseCapTwoPlus;
  const backup = profile.parents.reduce((s, p) => s + p.backupCare, 0);
  const stateRate = stateRateFor(profile.state);
  const anyOffers = profile.parents.some((p) => p.employerOffersDcfsa);

  const dcfsaHeadroom = anyOffers ? Math.max(0, Math.min(DCFSA_HOUSEHOLD_LIMIT, lowerEarned) - backup) : 0;
  const usable = Math.max(0, Math.min(dcfsaHeadroom, eligible - backup));
  const ctx: Ctx = { profile, agi, eligible, lowerEarned, capByKids, backup, stateRate, headroom: dcfsaHeadroom };

  const currentElection = profile.parents.reduce((s, p) => s + p.currentElection, 0);
  const current = evaluate(ctx, currentElection);

  // Brute-force search over elections in $50 steps: exact on the piecewise-linear objective at this resolution.
  let optimal = evaluate(ctx, 0);
  const curve = [{ election: 0, total: optimal.total }];
  let scenariosTested = 1;
  for (let e = 50; e <= usable; e += 50) {
    const s = evaluate(ctx, e);
    scenariosTested++;
    if (e % 250 === 0) curve.push({ election: e, total: s.total });
    if (s.total > optimal.total) optimal = s;
  }
  if (usable > 0 && usable % 50 !== 0) {
    const s = evaluate(ctx, usable);
    scenariosTested++;
    curve.push({ election: usable, total: s.total });
    if (s.total > optimal.total) optimal = s;
  }

  const foundMoney = Math.max(0, optimal.total - current.total);

  const ctcRaw = ctcChildren * CTC.perChild;
  const over = Math.max(0, agi - CTC.phaseOutStart[status]);
  const childTaxCredit = Math.max(0, ctcRaw - Math.ceil(over / 1_000) * CTC.phaseOutPer1000);

  const trumpKids = profile.children.filter((c) => c.birthYear >= TRUMP_ACCOUNT.birthYears[0] && c.birthYear <= TRUMP_ACCOUNT.birthYears[1]).length;
  const oneTimeExtras =
    trumpKids > 0 && !profile.trumpAccountElected
      ? [{ id: "trump_account", label: "Trump Account federal deposit (Form 4547)", amount: trumpKids * TRUMP_ACCOUNT.deposit }]
      : [];

  const warnings: Warning[] = [];
  const excessOverLimit = currentElection + backup - DCFSA_HOUSEHOLD_LIMIT;
  if (excessOverLimit > 0) {
    warnings.push({
      id: "cap_exceeded",
      message: `Both parents' elections plus backup care exceed the $${DCFSA_HOUSEHOLD_LIMIT.toLocaleString("en-US")} household limit. The excess becomes taxable wages.`,
      amount: excessOverLimit,
    });
  }
  if (current.forfeitLoss > 0) {
    warnings.push({
      id: "forfeit_risk",
      message: "Your current election is higher than the childcare you can claim. Unclaimed FSA money is forfeited.",
      amount: current.forfeitLoss,
    });
  }
  if (excludedExpenses > 0) {
    warnings.push({ id: "overnight_camp", message: "Overnight camp is not an eligible dependent-care expense (day camp is).", amount: excludedExpenses });
  }
  if (profile.paysRelative) {
    warnings.push({ id: "relative_provider", message: "Payments to your spouse, the child's parent, or your own child under 19 are not eligible." });
  }
  if (careChildren === 0) {
    warnings.push({ id: "no_care_children", message: "Dependent-care benefits apply only to children under 13." });
  }

  const actions: Action[] = [];
  if (anyOffers && optimal.election !== current.election) {
    for (const a of optimal.allocation.filter((x) => x.election > 0)) {
      actions.push({
        id: `elect_${a.parent}`,
        title: `Elect $${a.election.toLocaleString("en-US")} in ${possessive(a.parent)} Dependent Care FSA`,
        detail: "Set it at open enrollment, or mid-year after a qualifying change such as a new provider or a cost change.",
        impact: foundMoney,
        when: "Open enrollment (Nov–Dec) or within 30 days of a qualifying event",
      });
    }
    if (optimal.election === 0 && current.election > 0) {
      actions.push({
        id: "drop_fsa",
        title: "Skip the Dependent Care FSA and claim the tax credit instead",
        detail: `At your income the credit pays ${Math.round(optimal.careCreditRate * 100)}% of up to $${capByKids.toLocaleString("en-US")} of care, which beats the FSA.`,
        impact: foundMoney,
        when: "Open enrollment",
      });
    }
  }
  if (optimal.careCredit > 0) {
    actions.push({
      id: "claim_credit",
      title: `Claim $${optimal.careCredit.toLocaleString("en-US")} Child and Dependent Care Credit`,
      detail: "File Form 2441 with each provider's name, address and taxpayer ID (or keep a signed Form W-10).",
      impact: optimal.careCredit,
      when: "Tax season (Jan–Apr)",
    });
  }
  for (const x of oneTimeExtras) {
    actions.push({ id: x.id, title: `Elect the $${x.amount.toLocaleString("en-US")} ${x.label}`, detail: "One-time federal deposit for children born 2025–2028.", impact: x.amount, when: "With your 2026 return" });
  }

  const math: MathLine[] = [
    { label: "Household AGI (estimate)", value: round(agi), formula: "sum of earned income + other income" },
    { label: "Eligible childcare expenses", value: round(eligible), formula: "daycare + preschool + after-school + nanny + day camp (children under 13)", source: SOURCES.pub503 },
    { label: "DCFSA room this year", value: round(dcfsaHeadroom), formula: `min($${DCFSA_HOUSEHOLD_LIMIT.toLocaleString("en-US")}, lower earner's income) − backup care`, source: SOURCES.dcfsa },
    { label: "Marginal federal rate", value: marginalRate(agi, status), formula: "2026 brackets after standard deduction", source: SOURCES.brackets },
    { label: "Care credit rate at your AGI", value: optimal.careCreditRate, formula: "50% → 35% → 20% by AGI (§21)", source: SOURCES.cdcc },
    { label: "Credit expense cap", value: capByKids, formula: "$3,000 one child / $6,000 two or more, minus FSA dollars", source: SOURCES.cdcc },
    { label: "Optimal FSA election", value: optimal.election, formula: "maximises tax saved + FICA + state + credit" },
    { label: "Benefit with optimal plan", value: optimal.total, formula: "federal + FICA + state savings + care credit − forfeits" },
    { label: "Benefit with your current plan", value: current.total, formula: "same formula, your current elections" },
    { label: "Found money per year", value: foundMoney, formula: "optimal − current" },
  ];

  return {
    engineVersion: ENGINE_VERSION,
    taxYear: TAX_YEAR,
    agi: round(agi),
    careChildren,
    ctcChildren,
    eligibleExpenses: round(eligible),
    excludedExpenses: round(excludedExpenses),
    dcfsaHeadroom: round(dcfsaHeadroom),
    current,
    optimal,
    foundMoney: round(foundMoney),
    curve,
    scenariosTested,
    childTaxCredit: round(childTaxCredit),
    oneTimeExtras,
    actions,
    warnings,
    math,
  };
}
