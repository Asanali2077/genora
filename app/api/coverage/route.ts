import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { CoverageSettingsSchema, computeCoverage, saveCalendarAndPlan, withSummer } from "@/lib/services/coverage";
import { parseSchoolCalendar } from "@/lib/ai/tasks/school-calendar";

export const maxDuration = 60;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  rawText: z.string().max(12_000).optional(),
  // Manual or already-extracted closures (the AI step is skipped when these are sent).
  closures: z.array(z.object({ start: isoDate, end: isoDate, label: z.string().min(1).max(80) })).max(80).optional(),
  lastDay: isoDate.nullable().optional(),
  schoolYear: z.string().max(20).default("2026-27"),
  settings: CoverageSettingsSchema.default({ campPerKidPerDay: 60, sitterPerDay: 160, ptoReserve: 5, summerWeeks: 10 }),
});

export async function POST(req: Request) {
  const { sb, user } = await getUser();
  if (!user) return Response.json({ error: "Your session expired. Reload the page to continue." }, { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return Response.json({ error: "Build your family plan first." }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the dates and settings and try again." }, { status: 400 });
  const { rawText, settings, schoolYear } = parsed.data;

  let closures = parsed.data.closures;
  let lastDay = parsed.data.lastDay ?? null;
  let source: "ai" | "manual" = "manual";

  if (!closures) {
    if (!rawText?.trim()) return Response.json({ error: "Paste your school calendar or add dates by hand." }, { status: 400 });
    const ai = await parseSchoolCalendar(rawText);
    if (!ai.ok) {
      return Response.json(
        { error: "We couldn't read that calendar automatically. Add the no-school dates by hand below.", aiUnavailable: true },
        { status: 422 },
      );
    }
    closures = ai.data.closures;
    lastDay = ai.data.lastDay;
    source = "ai";
  }

  const today = new Date().toISOString().slice(0, 10);
  const all = withSummer(closures, lastDay, settings.summerWeeks);
  const result = computeCoverage(household.profile, all, settings, today);
  try {
    // Summer is stored as a closure, so later edits resend the full list with lastDay = null.
    await saveCalendarAndPlan(sb, household.id, schoolYear, rawText ?? null, all, result);
  } catch (err) {
    console.error("[coverage] save failed", err);
  }
  return Response.json({ closures: all, source, result });
}
