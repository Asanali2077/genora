/**
 * US federal rules for tax year 2026 used by the GENORA engine.
 * Every constant has a source. Statute links point to the current US Code (post-OBBBA, P.L. 119-21).
 */

export const TAX_YEAR = 2026;
export const ENGINE_VERSION = "2026.1";

export type FilingStatus = "mfj" | "single" | "hoh";

/** Rev. Proc. 2025-32 via Tax Foundation: https://taxfoundation.org/data/all/federal/2026-tax-brackets/ */
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  mfj: 32_200,
  hoh: 24_150,
};

/** Upper bound of each bracket (taxable income) and its rate. Same source as above. */
export const BRACKETS: Record<FilingStatus, ReadonlyArray<readonly [number, number]>> = {
  single: [
    [12_400, 0.1],
    [50_400, 0.12],
    [105_700, 0.22],
    [201_775, 0.24],
    [256_225, 0.32],
    [640_600, 0.35],
    [Infinity, 0.37],
  ],
  mfj: [
    [24_800, 0.1],
    [100_800, 0.12],
    [211_400, 0.22],
    [403_550, 0.24],
    [512_450, 0.32],
    [768_700, 0.35],
    [Infinity, 0.37],
  ],
  hoh: [
    [17_700, 0.1],
    [67_450, 0.12],
    [105_700, 0.22],
    [201_750, 0.24],
    [256_200, 0.32],
    [640_600, 0.35],
    [Infinity, 0.37],
  ],
};

/** Dependent Care FSA (§129): household limit, raised from $5,000 by OBBBA. https://www.law.cornell.edu/uscode/text/26/129 */
export const DCFSA_HOUSEHOLD_LIMIT = 7_500;

/** Child and Dependent Care Credit (§21). https://www.law.cornell.edu/uscode/text/26/21 */
export const CDCC = {
  expenseCapOneChild: 3_000,
  expenseCapTwoPlus: 6_000,
  maxRate: 0.5,
  firstPhaseStart: 15_000, // AGI above which the rate drops 1 pt per $2,000…
  firstPhaseStep: 2_000,
  midRate: 0.35, // …down to 35%
  secondPhaseStart: { mfj: 150_000, single: 75_000, hoh: 75_000 } as Record<FilingStatus, number>,
  secondPhaseStep: { mfj: 4_000, single: 2_000, hoh: 2_000 } as Record<FilingStatus, number>,
  floorRate: 0.2,
  childAgeLimit: 13, // care benefits: child under 13 (Pub 503)
};

/** Child Tax Credit (§24) 2026: $2,200 per child under 17, refundable up to $1,700. https://www.law.cornell.edu/uscode/text/26/24 */
export const CTC = {
  perChild: 2_200,
  refundablePerChild: 1_700,
  childAgeLimit: 17,
  phaseOutStart: { mfj: 400_000, single: 200_000, hoh: 200_000 } as Record<FilingStatus, number>,
  phaseOutPer1000: 50,
};

/** FICA on wages: 6.2% Social Security up to the 2026 wage base + 1.45% Medicare. https://www.journalofaccountancy.com/news/2025/oct/social-security-wage-base-and-cola-announced-for-2026/ */
export const FICA = {
  socialSecurityRate: 0.062,
  medicareRate: 0.0145,
  wageBase: 184_500,
};

/** Trump Accounts: $1,000 federal deposit for US-citizen children born 2025–2028 (elect on Form 4547). https://www.irs.gov/trumpaccounts */
export const TRUMP_ACCOUNT = { deposit: 1_000, birthYears: [2025, 2028] as const };

/**
 * Flat state income tax estimate (top marginal-ish rate for a middle-income family). Used only to estimate
 * the extra state savings of pre-tax FSA dollars; shown to the user as an estimate. States not listed use the default.
 */
export const STATE_RATE_DEFAULT = 0.05;
export const STATE_RATES: Record<string, number> = {
  AK: 0, FL: 0, NV: 0, NH: 0, SD: 0, TN: 0, TX: 0, WA: 0, WY: 0,
  CA: 0.08, NY: 0.0625, NJ: 0.0637, MA: 0.05, IL: 0.0495, PA: 0.0307, GA: 0.0539,
  NC: 0.0425, OH: 0.0275, MI: 0.0425, VA: 0.0575, CO: 0.044, AZ: 0.025, MN: 0.068, OR: 0.0875,
};

export const SOURCES = {
  brackets: "https://taxfoundation.org/data/all/federal/2026-tax-brackets/",
  dcfsa: "https://www.law.cornell.edu/uscode/text/26/129",
  cdcc: "https://www.law.cornell.edu/uscode/text/26/21",
  ctc: "https://www.law.cornell.edu/uscode/text/26/24",
  fica: "https://www.journalofaccountancy.com/news/2025/oct/social-security-wage-base-and-cola-announced-for-2026/",
  pub503: "https://www.irs.gov/publications/p503",
  trump: "https://www.irs.gov/trumpaccounts",
  midYear: "https://www.law.cornell.edu/cfr/text/26/1.125-4",
} as const;

/** Federal income tax on taxable income for a filing status (progressive brackets). */
export function federalTax(taxableIncome: number, status: FilingStatus): number {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of BRACKETS[status]) {
    if (taxableIncome <= lower) break;
    tax += (Math.min(taxableIncome, upper) - lower) * rate;
    lower = upper;
  }
  return tax;
}

/** Federal income tax given AGI (standard deduction assumed). */
export function federalTaxOnAgi(agi: number, status: FilingStatus): number {
  return federalTax(Math.max(0, agi - STANDARD_DEDUCTION[status]), status);
}

/** Marginal federal rate at an AGI (standard deduction assumed). */
export function marginalRate(agi: number, status: FilingStatus): number {
  const taxable = Math.max(0, agi - STANDARD_DEDUCTION[status]);
  if (taxable === 0) return 0;
  for (const [upper, rate] of BRACKETS[status]) if (taxable <= upper) return rate;
  return 0.37;
}

/** §21 applicable percentage for the Child and Dependent Care Credit. */
export function careCreditRate(agi: number, status: FilingStatus): number {
  const first = Math.ceil(Math.max(0, agi - CDCC.firstPhaseStart) / CDCC.firstPhaseStep) / 100;
  let rate = Math.max(CDCC.midRate, CDCC.maxRate - first);
  const overSecond = agi - CDCC.secondPhaseStart[status];
  if (overSecond > 0) {
    rate = Math.max(CDCC.floorRate, CDCC.midRate - Math.ceil(overSecond / CDCC.secondPhaseStep[status]) / 100);
  }
  return Math.round(rate * 100) / 100;
}

/** Employee FICA saved by excluding `amount` from wages, given the parent's wages. */
export function ficaSaved(amount: number, wages: number): number {
  const excluded = Math.max(0, Math.min(amount, wages));
  // Social Security applies only to wages up to the wage base; the excluded slice is the top `excluded` dollars.
  const sliceStart = wages - excluded;
  const ssTaxedInSlice = Math.max(0, Math.min(wages, FICA.wageBase) - sliceStart);
  return ssTaxedInSlice * FICA.socialSecurityRate + excluded * FICA.medicareRate;
}
