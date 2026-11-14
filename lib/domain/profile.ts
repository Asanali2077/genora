import { z } from "zod";

/** Household profile collected in onboarding. Stored in households.profile (jsonb) and fed to the engine. */

export const CARE_CATEGORIES = ["daycare", "preschool", "after_school", "nanny", "day_camp", "overnight_camp"] as const;
export type CareCategory = (typeof CARE_CATEGORIES)[number];

const money = z.number().min(0).max(5_000_000);

export const ParentSchema = z.object({
  label: z.string().min(1).max(40),
  earnedIncome: money,
  employerOffersDcfsa: z.boolean(),
  currentElection: z.number().min(0).max(20_000),
  backupCare: z.number().min(0).max(20_000).default(0),
  ptoDays: z.number().int().min(0).max(60).default(15),
});
export type Parent = z.infer<typeof ParentSchema>;

export const ChildSchema = z.object({
  name: z.string().max(40).default(""),
  birthYear: z.number().int().min(2005).max(2026),
});
export type Child = z.infer<typeof ChildSchema>;

export const EmployerBenefitSchema = z.object({
  name: z.string().min(1).max(120),
  kind: z.enum(["backup_care", "childcare_subsidy", "dcfsa_contribution", "dependent_care_fsa", "other"]),
  days: z.number().min(0).max(365).nullable().default(null),
  amount: z.number().min(0).max(100_000).nullable().default(null),
  detail: z.string().max(400).default(""),
});
export type EmployerBenefit = z.infer<typeof EmployerBenefitSchema>;

/** Household budget inputs for the 12-month forecast. Monthly amounts unless noted. */
export const BudgetSchema = z.object({
  housing: money.default(0),
  groceries: money.default(0),
  transport: money.default(0),
  utilities: money.default(0),
  insurance: money.default(0),
  debt: money.default(0),
  other: money.default(0),
  savings: money.default(0), // cash on hand today
  holidays: money.default(0), // yearly: winter holiday gifts, food, travel (Nov–Dec)
  vacation: money.default(0), // yearly: summer trip (July)
  backToSchool: money.default(0), // yearly: clothes, supplies, electronics (August)
});
export type Budget = z.infer<typeof BudgetSchema>;

export const ProfileSchema = z.object({
  filingStatus: z.enum(["mfj", "single", "hoh"]),
  state: z.string().length(2).toUpperCase(),
  otherIncome: money.default(0),
  parents: z.array(ParentSchema).min(1).max(2),
  children: z.array(ChildSchema).min(1).max(6),
  childcare: z.object(Object.fromEntries(CARE_CATEGORIES.map((c) => [c, money.default(0)])) as Record<CareCategory, z.ZodDefault<typeof money>>),
  paysRelative: z.boolean().default(false),
  gracePeriod: z.boolean().default(false),
  trumpAccountElected: z.boolean().default(false),
  employerBenefits: z.array(EmployerBenefitSchema).max(25).default([]),
  budget: BudgetSchema.prefault({}),
});
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInput = z.input<typeof ProfileSchema>;
