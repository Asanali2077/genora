import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/lib/domain/profile";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { buildLetters } from "@/lib/engine/paperwork";

describe("paperwork", () => {
  const profile = ProfileSchema.parse({
    filingStatus: "mfj",
    state: "CA",
    parents: [
      { label: "You", earnedIncome: 84_000, employerOffersDcfsa: true, currentElection: 2_000 },
      { label: "Sam", earnedIncome: 56_000, employerOffersDcfsa: false, currentElection: 0 },
    ],
    children: [{ birthYear: 2022 }],
    childcare: { daycare: 20_000 },
  });
  const result = analyzeBenefits(profile);
  const letters = buildLetters(profile, result, ["Little Oaks"]);

  it("writes the optimal election into the enrollment letter", () => {
    const enroll = letters.find((l) => l.id === "enroll-You")!;
    expect(enroll.body).toContain(`$${result.optimal.election.toLocaleString("en-US")}`);
    expect(enroll.body).toContain("will not elect");
  });

  it("adds a mid-year change letter citing Reg. 1.125-4(f) when the election should change", () => {
    const mid = letters.find((l) => l.id === "midyear")!;
    expect(mid.body).toContain("§1.125-4(f)");
    expect(mid.body).toContain("$2,000");
  });

  it("asks each provider for Form W-10", () => {
    expect(letters.find((l) => l.id === "w10-Little Oaks")?.subject).toContain("W-10");
  });
});
