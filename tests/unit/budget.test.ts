import { describe, expect, it } from "vitest";
import { ProfileSchema, type ProfileInput } from "@/lib/domain/profile";
import { BASE_SCENARIO, forecastBudget, takeHome } from "@/lib/engine/budget";

const base: ProfileInput = {
  filingStatus: "mfj",
  state: "TX",
  parents: [
    { label: "You", earnedIncome: 84_000, employerOffersDcfsa: true, currentElection: 0, ptoDays: 15 },
    { label: "Partner", earnedIncome: 56_000, employerOffersDcfsa: true, currentElection: 0, ptoDays: 15 },
  ],
  children: [{ name: "Mia", birthYear: 2023 }, { name: "Leo", birthYear: 2018 }],
  childcare: { daycare: 18_000, after_school: 3_000, day_camp: 2_400 },
  budget: { housing: 2_400, groceries: 1_100, transport: 600, utilities: 350, insurance: 400, other: 700, savings: 6_000, holidays: 1_780, vacation: 2_500, backToSchool: 858 },
};
const profile = ProfileSchema.parse(base);

describe("take-home pay", () => {
  it("subtracts federal tax, FICA and state tax from gross pay", () => {
    const t = takeHome(profile);
    // taxable 140,000 − 32,200 = 107,800 → 2,480 + 9,120 + 1,540 = 13,140
    expect(Math.round(t.federal)).toBe(13_140);
    expect(Math.round(t.fica)).toBe(Math.round(140_000 * 0.0765));
    expect(t.state).toBe(0); // Texas
    expect(Math.round(t.net)).toBe(140_000 - 13_140 - 10_710);
  });
});

describe("12-month forecast", () => {
  const f = forecastBudget(profile, { today: "2026-11-14" });

  it("covers 12 months starting with the current one and carries the balance forward", () => {
    expect(f.months).toHaveLength(12);
    expect(f.months[0].ym).toBe("2026-11");
    expect(f.months[11].ym).toBe("2027-10");
    let bal = f.startBalance;
    for (const m of f.months) {
      bal += m.net;
      expect(Math.abs(m.balance - bal)).toBeLessThanOrEqual(12); // rounding of lines
    }
  });

  it("puts tax credits in April and seasonal costs in their months", () => {
    const april = f.months.find((m) => m.ym === "2027-04")!;
    expect(april.lines.find((l) => l.label === "Child Tax Credit")?.amount).toBe(4_400);
    const dec = f.months.find((m) => m.ym === "2026-12")!;
    expect(dec.lines.find((l) => l.label === "Winter holidays")?.amount).toBe(-Math.round(1_780 * 0.65));
    const aug = f.months.find((m) => m.ym === "2027-08")!;
    expect(aug.lines.find((l) => l.label === "Back to school")?.amount).toBe(-858);
    expect(f.months.find((m) => m.ym === "2027-07")!.lines.find((l) => l.label === "Summer vacation")?.amount).toBe(-2_500);
  });

  it("spreads sick-day cost over the cold season after PTO is used", () => {
    // Mia (3): 2.6 illnesses, Leo (8): 1 → 7 days; spare PTO (15−5)×2 = 20 covers them all
    expect(f.sickDaysExpected).toBe(7);
    expect(f.totals.sick).toBe(0);
    const stressed = forecastBudget(profile, { today: "2026-11-14", scenario: { ...BASE_SCENARIO, extraSickDays: 20 } });
    expect(stressed.totals.sick).toBe(-(7 * 160)); // 27 days − 20 PTO = 7 paid days
  });

  it("shows what the Genora plan adds versus the family's current setup", () => {
    const without = forecastBudget(profile, { today: "2026-11-14", scenario: { ...BASE_SCENARIO, usePlan: false } });
    expect(f.endBalance).toBeGreaterThan(without.endBalance);
    expect(f.totals.benefit).toBeGreaterThan(without.totals.benefit);
  });

  it("ends daycare cost when a child starts kindergarten", () => {
    const k = forecastBudget(ProfileSchema.parse({ ...base, children: [{ name: "Mia", birthYear: 2022 }] }), { today: "2026-11-14" });
    const jul = k.months.find((m) => m.ym === "2027-07")!.lines.find((l) => l.label === "Daycare & preschool")?.amount;
    const aug = k.months.find((m) => m.ym === "2027-08")!.lines.find((l) => l.label === "Daycare & preschool");
    expect(jul).toBe(-1_500);
    expect(aug).toBeUndefined();
    expect(k.effects.some((e) => e.title === "Mia starts kindergarten")).toBe(true);
  });

  it("reports the cash buffer needed when the balance would go negative", () => {
    const tight = forecastBudget(ProfileSchema.parse({ ...base, budget: { ...base.budget, housing: 4_500, savings: 500 } }), { today: "2026-11-14" });
    expect(tight.shortfallMonths).toBeGreaterThan(0);
    expect(tight.bufferNeeded).toBe(-Math.min(...tight.months.map((m) => m.balance)));
  });
});
