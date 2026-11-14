import "server-only";
import { z } from "zod";
import { callStructured } from "@/lib/ai";
import { CARE_CATEGORIES } from "@/lib/domain/profile";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ReceiptFieldsSchema = z.object({
  provider: z.string().min(1).max(120),
  category: z.enum([...CARE_CATEGORIES, "other"]),
  amount: z.number().positive().max(100_000),
  serviceFrom: isoDate,
  serviceTo: isoDate,
  providerTinLast4: z.string().regex(/^\d{4}$/).nullable(),
});
export type ReceiptFields = z.infer<typeof ReceiptFieldsSchema>;

const SYSTEM = [
  "You read a US childcare receipt or invoice (photo or text) for a Dependent Care FSA claim.",
  "Return ONLY JSON: {\"provider\": string, \"category\": \"daycare\"|\"preschool\"|\"after_school\"|\"nanny\"|\"day_camp\"|\"overnight_camp\"|\"other\",",
  "\"amount\": number (total paid in USD), \"serviceFrom\": \"YYYY-MM-DD\", \"serviceTo\": \"YYYY-MM-DD\", \"providerTinLast4\": \"1234\"|null}.",
  "serviceFrom/serviceTo are the dates care was provided (not the payment date) — if only a month is shown use its first and last day; if only one date, use it for both.",
  "providerTinLast4: last 4 digits of the provider's EIN or SSN only if printed; never return more digits. Use null if absent.",
  "Classify a camp as overnight_camp only if it is residential/sleepaway. Never invent amounts or dates that are not on the document.",
].join("\n");

export async function parseReceipt(input: { imageDataUrl?: string; text?: string }) {
  return callStructured({
    schema: ReceiptFieldsSchema,
    system: SYSTEM,
    user: input.text ? `Receipt text:\n${input.text.slice(0, 6_000)}` : "Read the attached receipt image.",
    imageDataUrl: input.imageDataUrl,
  });
}
