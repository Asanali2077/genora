// Sample families for the one-click demo and QA (npm run samples prints the engine output).
import type { ProfileInput } from "@/lib/domain/profile";

export const SAMPLES: { id: string; name: string; profile: ProfileInput }[] = [
  {
    id: "garcia",
    name: "Garcia family — CA, $140k, 1 toddler in daycare",
    profile: { filingStatus: "mfj", state: "CA", parents: [{ label: "You", earnedIncome: 84_000, employerOffersDcfsa: true, currentElection: 0 }, { label: "Partner", earnedIncome: 56_000, employerOffersDcfsa: true, currentElection: 0 }], children: [{ birthYear: 2023 }], childcare: { daycare: 20_000 } },
  },
  {
    id: "garcia",
    name: "Nguyen family — NY, $185k, 2 kids, already elect $5,000 at one job",
    profile: { filingStatus: "mfj", state: "NY", parents: [{ label: "You", earnedIncome: 110_000, employerOffersDcfsa: true, currentElection: 5_000 }, { label: "Partner", earnedIncome: 75_000, employerOffersDcfsa: true, currentElection: 0 }], children: [{ birthYear: 2019 }, { birthYear: 2022 }], childcare: { daycare: 14_000, after_school: 4_500, day_camp: 3_000 } },
  },
  {
    id: "garcia",
    name: "Jordan — single parent, TX, $70k, 1 child",
    profile: { filingStatus: "hoh", state: "TX", parents: [{ label: "You", earnedIncome: 70_000, employerOffersDcfsa: true, currentElection: 0 }], children: [{ birthYear: 2021 }], childcare: { daycare: 12_000 } },
  },
  {
    id: "garcia",
    name: "Patel family — WA, $230k, both elect $5,000 (over the cap)",
    profile: { filingStatus: "mfj", state: "WA", parents: [{ label: "You", earnedIncome: 140_000, employerOffersDcfsa: true, currentElection: 5_000 }, { label: "Partner", earnedIncome: 90_000, employerOffersDcfsa: true, currentElection: 5_000 }], children: [{ birthYear: 2018 }, { birthYear: 2024 }], childcare: { daycare: 22_000, after_school: 5_000, overnight_camp: 2_500 } },
  },
  {
    id: "garcia",
    name: "Brooks family — IL, $120k, new baby 2025, no FSA at work",
    profile: { filingStatus: "mfj", state: "IL", parents: [{ label: "You", earnedIncome: 72_000, employerOffersDcfsa: false, currentElection: 0 }, { label: "Partner", earnedIncome: 48_000, employerOffersDcfsa: false, currentElection: 0 }], children: [{ birthYear: 2025 }], childcare: { daycare: 15_000 } },
  },
];
