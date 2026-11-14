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
    "For working parents in the US with kids under 13. Most who could use a Dependent Care FSA never do, and in 2026 the rules changed again. Genora checks both parents' benefits, plans every school break and keeps the money coming back all year.",
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
    "Best FSA election for each parent, recalculated whenever pay, kids or care costs change",
    "Employer benefits scanner: backup care, FSA contributions and childcare discounts priced in dollars",
    "Care SOS when a kid is sick or school is closed: cheapest way to cover it, messages ready",
    "School-break radar with PTO planning for both parents, exported to your calendar",
    "Claim vault with forfeiture alerts, plus HR and provider letters written for you",
    "Ask Genora, partner access and a running total of what Genora found you",
  ],
  weekly: [
    { when: "Every week", what: "Log daycare and camp receipts; see what your FSA still owes you." },
    { when: "When a kid gets sick", what: "Open Care SOS: the cheapest way to cover the day, in seconds." },
    { when: "Every school break", what: "The plan is already in your calendar: who covers which day." },
    { when: "Every open enrollment", what: "Elect the right amount for next year, letters ready for HR." },
  ],
} as const;

export type PlanId = (typeof pricing.plans)[number]["id"];

export const compare = {
  title: "Why not just use your benefits portal?",
  columns: ["Genora", "Employer benefits portal", "Tax software", "Spreadsheet"],
  rows: [
    { label: "Compares the FSA with the tax credit", values: ["Yes, across both parents' jobs", "One employer only", "After the year is over", "If you build it"] },
    { label: "Helps before open enrollment", values: ["Yes", "Yes", "No", "If you build it"] },
    { label: "Plans school breaks with both parents' PTO", values: ["Yes", "No", "No", "By hand"] },
    { label: "Tracks claims and warns before forfeiture", values: ["Yes", "Single account", "No", "By hand"] },
    { label: "Writes the HR and provider letters", values: ["Yes", "No", "No", "No"] },
  ],
} as const;

export const faq = [
  { q: "Is this tax advice?", a: "No. Genora gives educational estimates based on the 2026 federal rules and shows the rule behind every number. Confirm your elections with your plan administrator or a tax professional." },
  { q: "Do you need my bank login or Social Security number?", a: "Neither. You answer 11 questions about pay, kids and childcare costs. Receipts you upload stay in private storage and you can delete them any time." },
  { q: "What if only one of us has a Dependent Care FSA at work?", a: "That's common. Genora compares that one FSA with the childcare tax credit and tells you how much to elect, or whether to skip it." },
  { q: "Where does the AI come in?", a: "Only to read messy documents: your school calendar and childcare receipts. Every dollar figure comes from a rules engine you can check line by line." },
  { q: "What does it cost?", a: "Checking your number is free. The full plan is $99 a year or $12 a month for the whole household, and if Genora doesn't find you at least 10× its price this year, you get a refund." },
] as const;