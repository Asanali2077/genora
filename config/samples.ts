// Sample families for the one-click demo and QA (npm run samples prints the engine output).
import type { ProfileInput } from "@/lib/domain/profile";

export const SAMPLES: { id: string; name: string; profile: ProfileInput }[] = [
  {
    id: "garcia",
    name: "Garcia family — CA, $140k, toddler in daycare + 8-year-old in school",
    profile: { filingStatus: "mfj", state: "CA", parents: [{ label: "You", earnedIncome: 84_000, employerOffersDcfsa: true, currentElection: 0 }, { label: "Partner", earnedIncome: 56_000, employerOffersDcfsa: true, currentElection: 0 }], children: [{ name: "Mia", birthYear: 2023 }, { name: "Leo", birthYear: 2018 }], childcare: { daycare: 20_000, after_school: 3_000 }, budget: { housing: 2_600, groceries: 1_200, transport: 650, utilities: 380, insurance: 450, debt: 300, other: 900, savings: 7_000, holidays: 1_780, vacation: 2_500, backToSchool: 858 } },
  },
  {
    id: "garcia",
    name: "Nguyen family — NY, $185k, 2 kids, already elect $5,000 at one job",
    profile: { filingStatus: "mfj", state: "NY", parents: [{ label: "You", earnedIncome: 110_000, employerOffersDcfsa: true, currentElection: 5_000 }, { label: "Partner", earnedIncome: 75_000, employerOffersDcfsa: true, currentElection: 0 }], children: [{ name: "Leo", birthYear: 2019 }, { name: "Ava", birthYear: 2022 }], childcare: { daycare: 14_000, after_school: 4_500, day_camp: 3_000 } },
  },
  {
    id: "garcia",
    name: "Jordan — single parent, TX, $70k, 1 child",
    profile: { filingStatus: "hoh", state: "TX", parents: [{ label: "You", earnedIncome: 70_000, employerOffersDcfsa: true, currentElection: 0 }], children: [{ name: "Sam", birthYear: 2021 }], childcare: { daycare: 12_000 } },
  },
  {
    id: "garcia",
    name: "Patel family — WA, $230k, both elect $5,000 (over the cap)",
    profile: { filingStatus: "mfj", state: "WA", parents: [{ label: "You", earnedIncome: 140_000, employerOffersDcfsa: true, currentElection: 5_000 }, { label: "Partner", earnedIncome: 90_000, employerOffersDcfsa: true, currentElection: 5_000 }], children: [{ name: "Arjun", birthYear: 2018 }, { name: "Mira", birthYear: 2024 }], childcare: { daycare: 22_000, after_school: 5_000, overnight_camp: 2_500 } },
  },
  {
    id: "garcia",
    name: "Brooks family — IL, $120k, new baby 2025, no FSA at work",
    profile: { filingStatus: "mfj", state: "IL", parents: [{ label: "You", earnedIncome: 72_000, employerOffersDcfsa: false, currentElection: 0 }, { label: "Partner", earnedIncome: 48_000, employerOffersDcfsa: false, currentElection: 0 }], children: [{ name: "Noah", birthYear: 2025 }], childcare: { daycare: 15_000 } },
  },
];

/** The sample district calendar, already structured, so the one-click demo needs no AI call. */
export const SAMPLE_CLOSURES = [
  { start: "2026-09-07", end: "2026-09-07", label: "Labor Day" },
  { start: "2026-10-09", end: "2026-10-09", label: "Teacher professional development" },
  { start: "2026-10-12", end: "2026-10-12", label: "Indigenous Peoples' Day" },
  { start: "2026-11-11", end: "2026-11-11", label: "Veterans Day" },
  { start: "2026-11-23", end: "2026-11-27", label: "Thanksgiving break" },
  { start: "2026-12-21", end: "2027-01-01", label: "Winter break" },
  { start: "2027-01-18", end: "2027-01-18", label: "Martin Luther King Jr. Day" },
  { start: "2027-02-15", end: "2027-02-19", label: "Mid-winter break" },
  { start: "2027-03-12", end: "2027-03-12", label: "Teacher workday" },
  { start: "2027-04-05", end: "2027-04-09", label: "Spring break" },
  { start: "2027-05-31", end: "2027-05-31", label: "Memorial Day" },
];
export const SAMPLE_LAST_DAY = "2027-06-10";
export const SAMPLE_RECEIPT = { provider: "Little Oaks Early Learning", category: "daycare", amount: 1640, serviceFrom: "2026-10-01", serviceTo: "2026-10-31", providerTinLast4: "8826" } as const;