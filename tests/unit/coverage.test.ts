import { describe, expect, it } from "vitest";
import { expandGapDays, planCoverage, type CoverageInput } from "@/lib/engine/coverage";

const base: Omit<CoverageInput, "closures"> = {
  parents: [
    { label: "You", ptoDays: 10 },
    { label: "Partner", ptoDays: 10 },
  ],
  kidsInCare: 2,
  campPerKidPerDay: 60,
  sitterPerDay: 160,
  ptoReserve: 5,
  campMinDays: 3,
  combinedTaxRate: 0.3,
};

describe("expandGapDays", () => {
  it("keeps weekdays only and joins a break across a weekend", () => {
    // Fri Dec 18 2026 → Fri Jan 1 2027: 11 weekdays, one block
    const days = expandGapDays([{ start: "2026-12-18", end: "2027-01-01", label: "Winter break" }]);
    expect(days).toHaveLength(11);
    expect(new Set(days.map((d) => d.block)).size).toBe(1);
    expect(days[0].blockLength).toBe(11);
  });

  it("deduplicates overlapping closures and separates distant ones", () => {
    const days = expandGapDays([
      { start: "2026-11-25", end: "2026-11-27", label: "Thanksgiving" },
      { start: "2026-11-27", end: "2026-11-27", label: "Duplicate" },
      { start: "2026-10-12", end: "2026-10-12", label: "Teacher in-service" },
    ]);
    expect(days.map((d) => d.date)).toEqual(["2026-10-12", "2026-11-25", "2026-11-26", "2026-11-27"]);
    expect(days[0].blockLength).toBe(1);
    expect(days[1].blockLength).toBe(3);
  });

  it("drops days before the start date", () => {
    expect(expandGapDays([{ start: "2026-10-12", end: "2026-10-16", label: "Fall break" }], "2026-10-14")).toHaveLength(3);
  });
});

describe("planCoverage (PTO Tetris)", () => {
  const closures = [
    { start: "2026-10-12", end: "2026-10-12", label: "Teacher in-service" }, // single day → sitter $160
    { start: "2026-11-23", end: "2026-11-27", label: "Thanksgiving week" }, // 5 days → camp 2 × $60 = $120
    { start: "2026-12-21", end: "2027-01-01", label: "Winter break" }, // 10 days → camp $120
  ];

  it("spends spare PTO on the most expensive days first", () => {
    const r = planCoverage({ ...base, closures });
    expect(r.gapDays).toBe(16);
    // 5 spare days each = 10 PTO days; the single in-service day ($160) is covered by PTO first
    expect(r.assignments.find((a) => a.date === "2026-10-12")?.cover).toBe("pto");
    expect(r.ptoUsed).toEqual({ You: 5, Partner: 5 });
    expect(r.allPaidCost).toBe(160 + 15 * 120);
    expect(r.cashCost).toBe(6 * 120); // 16 days − 10 PTO = 6 camp days
    expect(r.savedByPto).toBe(r.allPaidCost - r.cashCost);
    expect(r.fsaTaxSaved).toBe(Math.round(720 * 0.3));
  });

  it("uses a sitter when camp for all kids costs more", () => {
    const r = planCoverage({ ...base, kidsInCare: 3, parents: [{ label: "You", ptoDays: 0 }], closures });
    expect(r.assignments.every((a) => a.cover === "sitter")).toBe(true); // 3 × $60 > $160
    expect(r.cashCost).toBe(16 * 160);
  });

  it("has no gaps without children in care", () => {
    const r = planCoverage({ ...base, kidsInCare: 0, closures });
    expect(r.gapDays).toBe(0);
    expect(r.cashCost).toBe(0);
  });
});
