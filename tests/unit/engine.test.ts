import { describe, expect, it } from "vitest";
import { ProfileSchema, type ProfileInput } from "@/lib/domain/profile";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { careCreditRate, federalTax, ficaSaved, marginalRate } from "@/lib/engine/tax-2026";

const profile = (p: Partial<ProfileInput> & Pick<ProfileInput, "parents" | "children">) =>
  ProfileSchema.parse({ filingStatus: "mfj", state: "TX", childcare: {}, ...p });

describe("2026 federal rules", () => {
  it("applies progressive MFJ brackets", () => {
    // 24,800 × 10% + (100,300 − 24,800) × 12%
    expect(federalTax(100_300, "mfj")).toBeCloseTo(11_540, 2);
    expect(federalTax(0, "single")).toBe(0);
  });

  it("returns the marginal rate after the standard deduction", () => {
    expect(marginalRate(140_000, "mfj")).toBe(0.22); // taxable 107,800
    expect(marginalRate(20_000, "mfj")).toBe(0); // below the $32,200 deduction
  });

  it("phases the care credit rate 50% → 35% → 20% (§21)", () => {
    expect(careCreditRate(15_000, "mfj")).toBe(0.5);
    expect(careCreditRate(16_000, "mfj")).toBe(0.49);
    expect(careCreditRate(140_000, "mfj")).toBe(0.35);
    expect(careCreditRate(180_000, "mfj")).toBe(0.27); // 30,000 over / 4,000 = 8 pts
    expect(careCreditRate(210_000, "mfj")).toBe(0.2);
    expect(careCreditRate(80_000, "single")).toBe(0.32); // 5,000 over / 2,000 = 3 pts
  });

  it("saves full FICA under the wage base and only Medicare above it", () => {
    expect(ficaSaved(7_500, 100_000)).toBeCloseTo(573.75, 2);
    // slice 182,500–190,000: only 2,000 below the $184,500 base pays Social Security
    expect(ficaSaved(7_500, 190_000)).toBeCloseTo(2_000 * 0.062 + 7_500 * 0.0145, 2);
  });
});

describe("Benefits Stack Optimizer", () => {
  const twoKidsMfj = profile({
    parents: [
      { label: "Alex", earnedIncome: 90_000, employerOffersDcfsa: true, currentElection: 0 },
      { label: "Sam", earnedIncome: 50_000, employerOffersDcfsa: true, currentElection: 0 },
    ],
    children: [{ birthYear: 2022 }, { birthYear: 2024 }],
    childcare: { daycare: 20_000 },
  });

  it("compares the full FSA with the credit for a $140k two-kid family in Texas", () => {
    const r = analyzeBenefits(twoKidsMfj);
    expect(r.current.careCredit).toBe(2_100); // 35% × $6,000
    expect(r.optimal.election).toBe(7_500);
    expect(r.optimal.federalSaved).toBe(1_600); // 7,000 × 22% + 500 × 12%
    expect(r.optimal.total).toBe(2_174); // 1,600 + 573.75 FICA, credit fully used up
    expect(r.foundMoney).toBe(74);
  });

  it("finds more money where state tax applies", () => {
    const r = analyzeBenefits({ ...twoKidsMfj, state: "CA" });
    expect(r.optimal.stateSaved).toBe(600); // 7,500 × 8%
    expect(r.foundMoney).toBe(674);
  });

  it("prefers the FSA for a single parent with one child", () => {
    const r = analyzeBenefits(
      profile({
        filingStatus: "hoh",
        state: "FL",
        parents: [{ label: "Jordan", earnedIncome: 70_000, employerOffersDcfsa: true, currentElection: 0 }],
        children: [{ birthYear: 2021 }],
        childcare: { daycare: 12_000 },
      }),
    );
    expect(r.current.careCredit).toBe(1_050); // 35% × $3,000
    expect(r.optimal.election).toBe(7_500);
    expect(r.optimal.total).toBe(1_474); // 900 federal + 573.75 FICA
    expect(r.foundMoney).toBe(424);
  });

  it("never recommends a plan worse than the current one", () => {
    for (const income of [60_000, 120_000, 180_000, 260_000]) {
      const r = analyzeBenefits(
        profile({
          parents: [
            { label: "A", earnedIncome: income * 0.6, employerOffersDcfsa: true, currentElection: 5_000 },
            { label: "B", earnedIncome: income * 0.4, employerOffersDcfsa: false, currentElection: 0 },
          ],
          children: [{ birthYear: 2020 }],
          childcare: { daycare: 9_000 },
        }),
      );
      expect(r.optimal.total).toBeGreaterThanOrEqual(r.current.total);
      expect(r.foundMoney).toBeGreaterThanOrEqual(0);
    }
  });

  it("limits the FSA to the lower earner's income", () => {
    const r = analyzeBenefits(
      profile({
        parents: [
          { label: "A", earnedIncome: 150_000, employerOffersDcfsa: true, currentElection: 0 },
          { label: "B", earnedIncome: 4_000, employerOffersDcfsa: false, currentElection: 0 },
        ],
        children: [{ birthYear: 2022 }],
        childcare: { daycare: 15_000 },
      }),
    );
    expect(r.dcfsaHeadroom).toBe(4_000);
    expect(r.optimal.election).toBeLessThanOrEqual(4_000);
  });

  it("warns when two employers' elections exceed the household cap", () => {
    const r = analyzeBenefits(
      profile({
        parents: [
          { label: "A", earnedIncome: 100_000, employerOffersDcfsa: true, currentElection: 5_000 },
          { label: "B", earnedIncome: 80_000, employerOffersDcfsa: true, currentElection: 5_000 },
        ],
        children: [{ birthYear: 2022 }, { birthYear: 2019 }],
        childcare: { daycare: 25_000 },
      }),
    );
    expect(r.warnings.find((w) => w.id === "cap_exceeded")?.amount).toBe(2_500);
  });

  it("flags forfeiture when the election exceeds eligible care", () => {
    const r = analyzeBenefits(
      profile({
        parents: [
          { label: "A", earnedIncome: 100_000, employerOffersDcfsa: true, currentElection: 7_500 },
          { label: "B", earnedIncome: 80_000, employerOffersDcfsa: false, currentElection: 0 },
        ],
        children: [{ birthYear: 2018 }],
        childcare: { after_school: 4_000 },
      }),
    );
    expect(r.current.forfeitLoss).toBe(3_500);
    expect(r.warnings.some((w) => w.id === "forfeit_risk")).toBe(true);
    expect(r.optimal.election).toBe(4_000);
  });

  it("excludes overnight camp and children 13 and older", () => {
    const r = analyzeBenefits(
      profile({
        parents: [{ label: "A", earnedIncome: 90_000, employerOffersDcfsa: false, currentElection: 0 }, { label: "B", earnedIncome: 60_000, employerOffersDcfsa: false, currentElection: 0 }],
        children: [{ birthYear: 2012 }],
        childcare: { day_camp: 2_000, overnight_camp: 3_000 },
      }),
    );
    expect(r.careChildren).toBe(0); // 14 at the end of 2026
    expect(r.eligibleExpenses).toBe(0);
    expect(r.excludedExpenses).toBe(3_000);
  });

  it("computes the Child Tax Credit with its phase-out and the Trump Account deposit", () => {
    const r = analyzeBenefits(
      profile({
        parents: [{ label: "A", earnedIncome: 300_000, employerOffersDcfsa: false, currentElection: 0 }, { label: "B", earnedIncome: 120_000, employerOffersDcfsa: false, currentElection: 0 }],
        children: [{ birthYear: 2025 }, { birthYear: 2016 }],
      }),
    );
    expect(r.childTaxCredit).toBe(4_400 - 20 * 50); // $20k over the $400k threshold
    expect(r.oneTimeExtras[0]?.amount).toBe(1_000);
  });
});
