import { describe, expect, it } from "vitest";
import { analyzeClaims, type ReceiptRow } from "@/lib/engine/claims";

const r = (p: Partial<ReceiptRow>): ReceiptRow => ({
  provider: "Little Oaks Daycare",
  category: "daycare",
  amount: 1_000,
  service_from: "2026-03-01",
  service_to: "2026-03-31",
  eligible: true,
  status: "logged",
  provider_tin_last4: "1234",
  ...p,
});

describe("Claim vault", () => {
  it("splits receipts by status and keeps only eligible care in the plan year", () => {
    const res = analyzeClaims({
      election: 7_500,
      expectedAnnualCare: 0,
      planYear: 2026,
      gracePeriod: false,
      today: "2026-07-01",
      receipts: [
        r({ status: "reimbursed" }),
        r({ status: "claimed", amount: 500 }),
        r({ status: "logged", amount: 250 }),
        r({ eligible: false, amount: 900 }), // overnight camp
        r({ service_from: "2025-12-01", service_to: "2025-12-31" }), // previous plan year
      ],
    });
    expect(res.logged).toBe(1_750);
    expect(res.reimbursed).toBe(1_000);
    expect(res.submitted).toBe(500);
    expect(res.waiting).toBe(250);
    expect(res.remaining).toBe(5_750);
  });

  it("projects forfeiture from the family's own annual estimate", () => {
    // Half the year gone, $3,000 logged, $4,000 a year expected → $3,000 + ~$2,000 = ~$5,000 of a $7,500 election
    const res = analyzeClaims({
      election: 7_500,
      expectedAnnualCare: 4_000,
      planYear: 2026,
      gracePeriod: false,
      today: "2026-07-02",
      receipts: [r({ amount: 3_000 })],
    });
    expect(res.yearElapsed).toBeCloseTo(0.5, 1);
    expect(res.forfeitRisk).toBeGreaterThan(2_400);
    expect(res.forfeitRisk).toBeLessThan(2_600);
    expect(res.deadline).toBe("2026-12-31");
  });

  it("extends the deadline with a grace period and flags providers without a taxpayer ID", () => {
    const res = analyzeClaims({
      election: 5_000,
      expectedAnnualCare: 10_000,
      planYear: 2026,
      gracePeriod: true,
      today: "2026-12-31",
      receipts: [r({ provider: "Sunny Day Camp", provider_tin_last4: null, category: "day_camp" }), r({})],
    });
    expect(res.deadline).toBe("2027-03-15");
    expect(res.daysToDeadline).toBe(74);
    // $2,000 logged + 74/365 of $10,000 expected care ≈ $4,027 of a $5,000 election
    expect(res.forfeitRisk).toBe(973);
    expect(res.missingTin).toEqual(["Sunny Day Camp"]);
  });
});
