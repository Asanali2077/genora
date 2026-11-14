/** Brand, copy and pricing. Product text lives here so components stay presentational. */

export const site = {
  name: "Genora",
  tagline: "The money engine for the childcare years",
  description:
    "Genora runs both parents' childcare benefits in 3 minutes, plans every school break at the lowest cost, and makes sure every childcare dollar comes back pre-tax.",
  disclaimer:
    "Educational estimates based on 2026 federal rules, not tax advice. Confirm elections with your plan administrator or a tax professional.",
} as const;

export const landing = {
  heroTitle: "Your family is probably overpaying for childcare. Let's find out how much.",
  heroSub:
    "Most parents who could use a Dependent Care FSA never do, and in 2026 the rules changed again. Genora checks both parents' benefits and tells you exactly what to elect.",
  calculatorTitle: "Try it with your numbers",
  calculatorNote: "Live result from the same 2026 engine the app uses. Assumes both employers offer a Dependent Care FSA and you only claim the credit today.",
  cta: "Find my money",
  pillars: [
    {
      title: "Benefits optimizer",
      body: "FSA, care credit or both? We test every split across both employers and show the math, line by line, with the IRS rule behind it.",
    },
    {
      title: "School-break radar",
      body: "Paste the school calendar. We find every day nobody is home and plan PTO and FSA-eligible day camps at the lowest cost.",
    },
    {
      title: "Claim vault",
      body: "Snap a daycare receipt. We track what your FSA still owes you and warn you weeks before unclaimed money is forfeited.",
    },
  ],
  proof: [
    { stat: "$13,184", label: "average yearly price of childcare per child in 2025", source: "Child Care Aware of America" },
    { stat: "$7,500", label: "new 2026 household Dependent Care FSA limit, up from $5,000", source: "26 U.S.C. §129" },
    { stat: "29 vs 16", label: "days schools close each year vs paid leave a typical worker gets", source: "Center for American Progress" },
  ],
} as const;

export const pricing = {
  title: "Keep every childcare dollar working",
  sub: "One plan for the whole household. Both parents included.",
  guarantee: "If Genora doesn't find you at least 10× its price this year, we refund you.",
  mockNotice: "Demo checkout: no card is charged during the hackathon.",
  plans: [
    { id: "annual", name: "Annual", price: 99, period: "year", perDay: 0.27, highlight: true, note: "Matches your FSA plan year" },
    { id: "monthly", name: "Monthly", price: 12, period: "month", perDay: 0.39, highlight: false, note: "Cancel anytime" },
  ],
  features: [
    "Optimal FSA election for each parent, updated when anything changes",
    "School-break radar with PTO planning for both parents",
    "Claim vault with forfeiture alerts and a year-end Form 2441 summary",
    "Partner access on the same plan",
  ],
} as const;

export type PlanId = (typeof pricing.plans)[number]["id"];
