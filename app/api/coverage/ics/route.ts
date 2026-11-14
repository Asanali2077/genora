import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { getLatestCoverage } from "@/lib/services/coverage";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { TAX_YEAR } from "@/lib/engine/tax-2026";

/** Exports the school-break plan as an .ics file that Google, Apple and Outlook calendars can import. */
export async function GET() {
  const { sb, user } = await getUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const household = await getHousehold(sb, user.id);
  if (!household) return new Response("No household", { status: 404 });
  const { result } = await getLatestCoverage(sb, household.id);
  if (!result) return new Response("No plan yet", { status: 404 });

  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ymd = (iso: string) => iso.replace(/-/g, "");
  const next = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`);

  const events = result.assignments.map((a) => {
    const who = a.cover === "pto" ? `${a.who === "You" ? "Your" : `${a.who}'s`} PTO` : a.cover === "camp" ? "Day camp" : "Sitter";
    return [
      "BEGIN:VEVENT",
      `UID:${household.id}-${a.date}@genora`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(a.date)}`,
      `DTEND;VALUE=DATE:${ymd(next(a.date))}`,
      `SUMMARY:${esc(`No school: ${a.label} · ${who}`)}`,
      `DESCRIPTION:${esc(a.cost > 0 ? `Planned cost $${a.cost} (FSA-eligible). Plan by Genora.` : "Covered with PTO. Plan by Genora.")}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ].join("\r\n");
  });

  const today = new Date().toISOString().slice(0, 10);
  const claims = claimsSummary(household.profile, await listReceipts(sb, household.id), today);
  const deadline = (date: string, uid: string, summary: string, description: string) =>
    ["BEGIN:VEVENT", `UID:${household.id}-${uid}@genora`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(next(date))}`, `SUMMARY:${esc(summary)}`, `DESCRIPTION:${esc(description)}`, "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${esc(summary)}`, "END:VALARM", "END:VEVENT"].join("\r\n");
  if (!claims.recommended) events.push(deadline(claims.deadline, "fsa-deadline", "Dependent Care FSA claim deadline", "Submit every childcare receipt so no FSA money is forfeited. Reminder set 7 days before."));
  events.push(deadline(`${TAX_YEAR + 1}-04-15`, "tax-day", "Tax day: file Form 2441", "Use the Form 2441 summary in Genora Claims (providers, taxpayer IDs, amounts)."));

  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Genora//School breaks//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:School breaks (Genora)", ...events, "END:VCALENDAR"].join("\r\n");
  return new Response(body, {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="genora-school-breaks.ics"' },
  });
}
