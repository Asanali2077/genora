import { describe, expect, it } from "vitest";
import { nextActions, type ActionInput } from "@/lib/engine/actions";

const base: ActionInput = {
  today: "2026-11-14",
  pro: false,
  foundMoney: 674,
  bestElection: 7500,
  electionParent: "You",
  hasBudget: true,
  shortfall: { months: 0, buffer: 0, label: "Dec 2026" },
  claims: { recommended: true, forfeitRisk: 0, deadline: "2026-12-31", daysToDeadline: 47, missingTin: [], receipts: 0 },
  hasCalendar: true,
  uncoveredDays: 0,
  scannedBenefits: 1,
  twoParents: true,
  enrollmentOpen: true,
};

describe("nextActions", () => {
  it("puts the FSA election first during open enrollment, with its money at stake", () => {
    const a = nextActions(base);
    expect(a[0].id).toBe("elect");
    expect(a[0].impact).toBe(674);
    expect(a[0].due).toBe("2026-12-15");
  });

  it("ranks a cash shortfall above everything else and sizes it", () => {
    const a = nextActions({ ...base, shortfall: { months: 2, buffer: 1800, label: "Jul 2027" } });
    expect(a[0].id).toBe("shortfall");
    expect(a[0].title).toContain("$1,800");
  });

  it("warns about forfeiture only for a real election, urgent inside 60 days", () => {
    expect(nextActions(base).some((x) => x.id === "forfeit")).toBe(false);
    const a = nextActions({ ...base, claims: { ...base.claims, recommended: false, forfeitRisk: 900 } });
    const f = a.find((x) => x.id === "forfeit")!;
    expect(f.urgency).toBe("now");
    expect(f.pro).toBe(true);
  });

  it("asks for missing setup data instead of guessing", () => {
    const a = nextActions({ ...base, hasBudget: false, hasCalendar: false, scannedBenefits: 0 });
    expect(a.filter((x) => x.urgency === "setup").map((x) => x.id)).toEqual(expect.arrayContaining(["bills", "calendar", "scan"]));
  });

  it("has nothing to elect when the credit alone is best", () => {
    const a = nextActions({ ...base, foundMoney: 0, bestElection: 0 });
    expect(a.some((x) => x.id === "elect" || x.id === "hr-letter")).toBe(false);
  });
});
