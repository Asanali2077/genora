import { getUser } from "@/lib/supabase/server";
import { getHousehold } from "@/lib/services/household";
import { getLatestCoverage } from "@/lib/services/coverage";

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

  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Genora//School breaks//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:School breaks (Genora)", ...events, "END:VCALENDAR"].join("\r\n");
  return new Response(body, {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="genora-school-breaks.ics"' },
  });
}
