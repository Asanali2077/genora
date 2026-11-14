import "server-only";
import { z } from "zod";
import { callStructured } from "@/lib/ai";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ParsedCalendarSchema = z.object({
  schoolYear: z.string().max(20),
  firstDay: isoDate.nullable(),
  lastDay: isoDate.nullable(),
  closures: z
    .array(z.object({ start: isoDate, end: isoDate, label: z.string().min(1).max(80) }))
    .max(80)
    .refine((list) => list.every((c) => c.end >= c.start), { message: "closure ends before it starts" }),
});
export type ParsedCalendar = z.infer<typeof ParsedCalendarSchema>;

const SYSTEM = [
  "You extract no-school days from a US school district calendar pasted by a parent.",
  "Return ONLY JSON: {\"schoolYear\": \"2026-27\", \"firstDay\": \"YYYY-MM-DD\"|null, \"lastDay\": \"YYYY-MM-DD\"|null,",
  "\"closures\": [{\"start\": \"YYYY-MM-DD\", \"end\": \"YYYY-MM-DD\", \"label\": \"Thanksgiving break\"}]}.",
  "Include every day students do not attend: holidays, breaks, teacher work/in-service/professional development days, conferences with no school.",
  "Exclude early-release days, exam days and anything where students still attend. Do not include summer; firstDay/lastDay cover it.",
  "Resolve years from context (fall dates belong to the first year of the school year, spring dates to the second).",
  "Never invent dates that are not in the text. If nothing is found return an empty closures array.",
].join("\n");

export async function parseSchoolCalendar(rawText: string) {
  return callStructured({ schema: ParsedCalendarSchema, system: SYSTEM, user: rawText.slice(0, 12_000) });
}

/** A labelled sample so the flow can be tried without a real calendar at hand. */
export const SAMPLE_CALENDAR = `Sample district 2026–2027 student calendar
Aug 19, 2026 – First day of school
Sep 7 – Labor Day (no school)
Oct 9 – Teacher professional development, no students
Oct 12 – Indigenous Peoples' Day (no school)
Nov 11 – Veterans Day
Nov 23–27 – Thanksgiving break
Dec 21, 2026 – Jan 1, 2027 – Winter break
Jan 18 – Martin Luther King Jr. Day
Feb 15–19 – Mid-winter break
Mar 12 – Teacher workday, no school for students
Apr 5–9 – Spring break
May 31 – Memorial Day
Jun 10, 2027 – Last day of school (early release)`;
