/** Short, sourced guides. Every rule matches lib/engine/tax-2026.ts. */
export type Guide = { slug: string; title: string; summary: string; minutes: number; sections: { heading: string; body: string[] }[]; sources: { label: string; url: string }[] };

export const guides: Guide[] = [
  {
    slug: "fsa-vs-credit",
    title: "Dependent Care FSA or the childcare tax credit? How to choose in 2026",
    summary: "The FSA limit rose to $7,500 and the credit got richer at lower incomes. The right answer now flips inside the same income band.",
    minutes: 4,
    sections: [
      {
        heading: "What changed for 2026",
        body: [
          "The household limit for a Dependent Care FSA rose from $5,000 to $7,500 (IRC §129), the first increase since 1986.",
          "The Child and Dependent Care Credit (IRC §21) now starts at 50% of eligible expenses, falls 1 point per $2,000 of AGI above $15,000 to 35%, and then falls again above $150,000 for joint filers (1 point per $4,000) to a 20% floor.",
        ],
      },
      {
        heading: "Why you can't simply take both",
        body: [
          "The credit applies to up to $3,000 of care for one child or $6,000 for two or more. Every FSA dollar reduces that cap dollar for dollar.",
          "A full $7,500 FSA therefore wipes out the credit. The question is which pays more per dollar: the FSA saves your marginal federal rate plus 7.65% Social Security and Medicare plus state tax; the credit pays a flat 20–50%.",
        ],
      },
      {
        heading: "Rules of thumb",
        body: [
          "One child and a household income above roughly $100,000: the FSA usually wins.",
          "Two children around $120,000–150,000 joint: it is close, and state income tax often decides. Run the numbers.",
          "Above $210,000 joint the credit is at its 20% floor, so the FSA wins clearly.",
        ],
      },
    ],
    sources: [
      { label: "26 U.S.C. §129", url: "https://www.law.cornell.edu/uscode/text/26/129" },
      { label: "26 U.S.C. §21", url: "https://www.law.cornell.edu/uscode/text/26/21" },
    ],
  },
  {
    slug: "eligible-care",
    title: "What counts as eligible childcare (and what doesn't)",
    summary: "Day camp counts, overnight camp doesn't. Kindergarten tuition doesn't, after-school care does. The full list.",
    minutes: 3,
    sections: [
      {
        heading: "Counts",
        body: [
          "Daycare and preschool, before- and after-school care, a nanny or babysitter paid so you can work or look for work, and day camps — including summer and school-break camps.",
          "Registration or agency fees you must pay to get the care.",
          "The child must be under 13 when the care is provided.",
        ],
      },
      {
        heading: "Doesn't count",
        body: [
          "Overnight camp, kindergarten and higher-grade tuition, summer school and tutoring.",
          "Payments to your spouse, to the child's parent, or to your own child under 19.",
          "A forfeited deposit, or care while you are not working.",
        ],
      },
      {
        heading: "Keep the paperwork",
        body: ["You need each provider's name, address and taxpayer ID for FSA claims and Form 2441. If a provider won't give it, keep a signed request (Form W-10) to show due diligence."],
      },
    ],
    sources: [{ label: "IRS Publication 503", url: "https://www.irs.gov/publications/p503" }],
  },
  {
    slug: "two-employers",
    title: "Two parents, two employers, one $7,500 limit",
    summary: "The FSA limit is per household, not per parent. How to split it and avoid taxable excess.",
    minutes: 3,
    sections: [
      {
        heading: "The cap is shared",
        body: [
          "If both employers offer a Dependent Care FSA, your combined elections plus any employer-paid backup care must stay within $7,500. Anything above becomes taxable wages.",
          "The exclusion also can't exceed the lower-earning spouse's income for the year.",
        ],
      },
      {
        heading: "Who should elect",
        body: [
          "Put the election with the parent whose pay is below the Social Security wage base ($184,500 in 2026): they save the full 7.65% payroll tax, not just 1.45% Medicare.",
          "Tell each HR team what the other parent elected so neither plan pushes you over the limit.",
        ],
      },
    ],
    sources: [{ label: "26 U.S.C. §129", url: "https://www.law.cornell.edu/uscode/text/26/129" }],
  },
  {
    slug: "deadlines",
    title: "Use it or lose it: FSA deadlines, grace periods and mid-year changes",
    summary: "Dependent Care FSAs have no carryover. How to avoid forfeiting money, and when you can change your election.",
    minutes: 3,
    sections: [
      {
        heading: "No carryover",
        body: [
          "Unlike some health FSAs, a Dependent Care FSA can't carry money into next year. Some plans add a grace period up to March 15 to use the money and a run-out period to submit claims.",
          "Log every daycare and camp receipt as you pay it so you know early whether you're on pace.",
        ],
      },
      {
        heading: "You can change your election mid-year",
        body: [
          "A new provider, a change in hours (for example a child starting school), or a cost increase by a non-relative provider lets you change your election, usually within 30 days.",
          "Life events — birth, adoption, marriage, divorce, a job change — also qualify.",
        ],
      },
    ],
    sources: [
      { label: "Treas. Reg. §1.125-4", url: "https://www.law.cornell.edu/cfr/text/26/1.125-4" },
      { label: "IRS Notice 2005-42", url: "https://www.irs.gov/pub/irs-drop/n-05-42.pdf" },
    ],
  },
];
