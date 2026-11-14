import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/lib/domain/profile";
import { careOptions, lifeEvents, savingsSummary } from "@/lib/engine/family";

const profile = ProfileSchema.parse({
  filingStatus: "mfj",
  state: "CA",
  parents: [{ label: "You", earnedIncome: 90_000, employerOffersDcfsa: true, currentElection: 0 }, { label: "Sam", earnedIncome: 60_000, employerOffersDcfsa: false, currentElection: 0 }],
  children: [{ name: "Leo", birthYear: 2015 }, { name: "Mia", birthYear: 2022 }],
  childcare: { daycare: 15_000 },
});

describe("life events", () => {
  it("dates the end of care benefits, kindergarten and the CTC age-out from birth years", () => {
    const ev = lifeEvents(profile, "2026-11-14", { gracePeriod: true });
    const titles = ev.map((e) => e.title);
    expect(titles).toContain("Leo turns 13 in 2028");
    expect(titles).toContain("Mia starts kindergarten");
    expect(titles).toContain("Leo ages out of the Child Tax Credit");
    expect(titles).toContain("Grace period ends");
    expect(ev.every((e) => e.date >= "2026-11-14")).toBe(true);
    expect(ev.map((e) => e.date)).toEqual([...ev.map((e) => e.date)].sort());
  });
});

describe("care SOS", () => {
  it("ranks free options first and prices a sitter after FSA tax savings", () => {
    const opts = careOptions({ days: 2, kids: 1, parents: [{ label: "You", ptoLeft: 1 }, { label: "Sam", ptoLeft: 6 }], backupCareDaysLeft: 0, sitterPerDay: 160, combinedTaxRate: 0.3, fsaRoomLeft: 5_000 });
    expect(opts[0].id).toBe("pto-Sam"); // only Sam has 2 PTO days
    const sitter = opts.find((o) => o.id === "sitter")!;
    expect(sitter.cashCost).toBe(320);
    expect(sitter.afterTaxCost).toBe(224); // 320 − 30% × 320
    expect(opts.find((o) => o.id === "pto-You")!.available).toBe(false);
  });
});

describe("savings counter", () => {
  it("adds only positive parts and expresses the return on the plan price", () => {
    const s = savingsSummary([{ label: "Benefits plan", amount: 674 }, { label: "PTO plan", amount: 1_500 }, { label: "Nothing", amount: 0 }], 99);
    expect(s.total).toBe(2_174);
    expect(s.parts).toHaveLength(2);
    expect(s.roi).toBe(21);
  });
});
