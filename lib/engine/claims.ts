/**
 * Claim vault math: how much of the Dependent Care FSA has been used, what is waiting to be submitted,
 * and how much is on track to be forfeited by the deadline. Pure and deterministic.
 */

export type ReceiptRow = {
  provider: string;
  category: string;
  amount: number;
  service_from: string;
  service_to: string;
  eligible: boolean;
  status: "logged" | "claimed" | "reimbursed";
  provider_tin_last4: string | null;
};

export type ClaimsInput = {
  election: number; // household FSA election for the plan year
  expectedAnnualCare: number; // eligible childcare the family expects to pay this year (from the profile)
  receipts: ReceiptRow[];
  planYear: number;
  gracePeriod: boolean; // claims allowed until March 15 of the next year
  today: string; // ISO date
};

export type ClaimsResult = {
  election: number;
  logged: number; // eligible receipts in the plan year
  waiting: number; // logged but not yet submitted to the administrator
  submitted: number;
  reimbursed: number;
  remaining: number; // election not yet covered by receipts
  projectedClaims: number;
  forfeitRisk: number;
  deadline: string;
  daysToDeadline: number;
  yearElapsed: number; // 0..1
  missingTin: string[];
  byProvider: { provider: string; total: number; hasTin: boolean }[];
};

const DAY = 86_400_000;
const utc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

export function analyzeClaims(input: ClaimsInput): ClaimsResult {
  const yearStart = Date.UTC(input.planYear, 0, 1);
  const yearEnd = Date.UTC(input.planYear, 11, 31);
  const deadline = input.gracePeriod ? `${input.planYear + 1}-03-15` : `${input.planYear}-12-31`;
  const now = utc(input.today);

  // Only care received inside the plan year counts (grace period extends service dates to Mar 15).
  const serviceEnd = utc(deadline);
  const inYear = input.receipts.filter((r) => r.eligible && utc(r.service_from) >= yearStart && utc(r.service_from) <= serviceEnd);
  const sum = (rows: ReceiptRow[]) => rows.reduce((s, r) => s + Number(r.amount), 0);

  const logged = sum(inYear);
  const waiting = sum(inYear.filter((r) => r.status === "logged"));
  const submitted = sum(inYear.filter((r) => r.status === "claimed"));
  const reimbursed = sum(inYear.filter((r) => r.status === "reimbursed"));

  const yearElapsed = Math.min(1, Math.max(0, (now - yearStart) / (yearEnd - yearStart)));
  // Care still to come before the deadline (including a grace period) follows the family's own annual estimate.
  const yearsLeft = Math.max(0, (serviceEnd - now) / (365 * DAY));
  const projectedClaims = logged + input.expectedAnnualCare * yearsLeft;
  const forfeitRisk = Math.max(0, Math.round(input.election - Math.min(input.election, projectedClaims)));

  const providers = new Map<string, { total: number; hasTin: boolean }>();
  for (const r of inYear) {
    const p = providers.get(r.provider) ?? { total: 0, hasTin: false };
    p.total += Number(r.amount);
    p.hasTin ||= Boolean(r.provider_tin_last4);
    providers.set(r.provider, p);
  }
  const byProvider = [...providers.entries()].map(([provider, v]) => ({ provider, total: Math.round(v.total), hasTin: v.hasTin })).sort((a, b) => b.total - a.total);

  return {
    election: input.election,
    logged: Math.round(logged),
    waiting: Math.round(waiting),
    submitted: Math.round(submitted),
    reimbursed: Math.round(reimbursed),
    remaining: Math.max(0, Math.round(input.election - logged)),
    projectedClaims: Math.round(projectedClaims),
    forfeitRisk,
    deadline,
    daysToDeadline: Math.max(0, Math.ceil((utc(deadline) - now) / DAY)),
    yearElapsed,
    missingTin: byProvider.filter((p) => !p.hasTin).map((p) => p.provider),
    byProvider,
  };
}
