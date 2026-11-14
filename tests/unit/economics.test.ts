import { describe, expect, it } from "vitest";
import { economics } from "@/config/economics";
import { unitEconomics } from "@/lib/engine/economics";

describe("unit economics (base case)", () => {
  it("matches the base case in docs/STRATEGY.md", () => {
    const u = unitEconomics({ ...economics });
    expect(u.visitToPaid).toBeCloseTo(0.55 * 0.7 * 0.85 * 0.07, 6); // ≈ 2.29%
    expect(Math.round(u.blendedCac)).toBe(31);
    expect(u.arpu).toBeCloseTo(0.6 * 99 + 0.4 * 144, 6); // $117
    expect(u.ltvToCac).toBeGreaterThan(3);
    expect(u.householdsFor100mArr).toBe(Math.ceil(100_000_000 / 117));
  });
});
