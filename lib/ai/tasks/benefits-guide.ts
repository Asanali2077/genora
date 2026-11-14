import "server-only";
import { z } from "zod";
import { callStructured } from "@/lib/ai";
import { EmployerBenefitSchema } from "@/lib/domain/profile";

export const ScanSchema = z.object({ benefits: z.array(EmployerBenefitSchema).max(25) });

const SYSTEM = [
  "You read a US employer benefits guide (PDF or text) for a working parent and list ONLY benefits that help with childcare or dependent care.",
  "Return ONLY JSON: {\"benefits\": [{\"name\": string, \"kind\": \"backup_care\"|\"childcare_subsidy\"|\"dcfsa_contribution\"|\"dependent_care_fsa\"|\"other\",",
  "\"days\": number|null (backup care days per year), \"amount\": number|null (USD per year paid by the employer), \"detail\": string (one sentence: what it is and how to use it)}]}.",
  "Examples: backup child care days (e.g. Bright Horizons, Care.com), childcare tuition discounts or subsidies, employer contributions to a Dependent Care FSA, the Dependent Care FSA itself,",
  "lactation/parental programs or tutoring benefits (kind other). Use numbers only if the document states them. Never invent a benefit or a number. If none, return an empty list.",
].join("\n");

export async function scanBenefitsGuide(input: { fileDataUrl?: string; text?: string }) {
  return callStructured({
    schema: ScanSchema,
    system: SYSTEM,
    user: input.text ? `Benefits guide text:\n${input.text.slice(0, 20_000)}` : "Read the attached benefits guide.",
    imageDataUrl: input.fileDataUrl,
  });
}

/** A short sample guide excerpt (clearly labelled in the UI) so the scanner can be tried without a document. */
export const SAMPLE_GUIDE = `ACME Corp 2027 Benefits Guide — Family support (sample)
Backup Care: Through Bright Horizons, employees receive 10 days per year of subsidized in-center or in-home backup child care at a copay of $25 per day.
Dependent Care FSA: Set aside up to $7,500 per household pre-tax for childcare. ACME contributes $500 per year to your Dependent Care FSA when you enroll.
Childcare Discount: 10% tuition discount at participating KinderCare centers.
Tutoring: Free online tutoring sessions for employees' children in grades K-12 through Varsity Tutors.`;
