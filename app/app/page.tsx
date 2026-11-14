import Link from "next/link";
import type { Metadata } from "next";
import { Camera, CalendarDays, Landmark } from "lucide-react";
import { requireHousehold } from "@/lib/services/access";
import { getLatestPlan } from "@/lib/services/household";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { getLatestCoverage } from "@/lib/services/coverage";
import { possessive } from "@/lib/engine/benefits";
import { TrackView } from "@/components/track-view";
import { Locked } from "@/components/app/locked";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Family money pulse — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const day = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

/** Seasonal moments that bring the family back (see docs/STRATEGY.md). */
function seasonalNote(month: number, election: number) {
  if (month >= 10) return { title: "Open enrollment is happening now", body: `Lock in next year's Dependent Care FSA at ${usd(election)} before your employer's deadline.` };
  if (month <= 2) return { title: "Tax season", body: "Your Form 2441 summary is ready in Claims. Check that every provider has a taxpayer ID." };
  if (month <= 4) return { title: "Summer camps are booking", body: "Day camps are FSA-eligible; overnight camps are not. Plan the summer in School breaks." };
  if (month >= 7 && month <= 8) return { title: "A new school year", body: "Paste the new district calendar to plan every break before it starts." };
  return null;
}

function Row({ icon, title, value, detail, action }: { icon: React.ReactNode; title: string; value: string; detail: string; action: React.ReactNode }) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:p-6">
      <span className="flex size-11 items-center justify-center rounded-[12px] bg-pine/[0.08] text-pine" aria-hidden>{icon}</span>
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
        <p className="mt-0.5 font-heading text-2xl font-extrabold tracking-tight text-ink tabular">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <div>{action}</div>
    </div>
  );
}

export default async function PulsePage() {
  const { sb, household, pro } = await requireHousehold();
  const today = new Date().toISOString().slice(0, 10);
  const [plan, receipts, coverage] = await Promise.all([getLatestPlan(sb, household.id), listReceipts(sb, household.id), getLatestCoverage(sb, household.id)]);
  const claims = claimsSummary(household.profile, receipts, today);
  const upcoming = (coverage.result?.assignments ?? []).filter((a) => a.date >= today);
  const next = upcoming[0];
  const season = seasonalNote(new Date().getUTCMonth(), plan?.result.optimal.election ?? 0);
  const best = plan?.result.optimal;
  const firstAlloc = best?.allocation.find((a) => a.election > 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10">
      <TrackView name="dashboard_view" props={{ pro }} />
      <p className="text-sm font-semibold text-pine">{household.name === "My family" ? "Your family" : household.name} · 2026</p>
      <h1 className="mt-2 text-[2.1rem] font-extrabold leading-[1.08] text-ink sm:text-5xl">
        {best ? (
          <>Genora gets your family <span className="marker tabular">{usd(best.total)}</span> back this year.</>
        ) : (
          "Your family money pulse"
        )}
      </h1>
      {plan && plan.result.foundMoney > 0 && (
        <p className="mt-3 text-lg text-muted-foreground">{usd(plan.result.foundMoney)} of it is money you were leaving on the table.</p>
      )}

      {season && (
        <div className="inset mt-7 flex items-start gap-4 p-4 sm:p-5">
          <Mark size={22} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-ink">{season.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{season.body}</p>
          </div>
        </div>
      )}

      {!pro ? (
        <div className="mt-8">
          <Locked title="Unlock the full plan" body="School-break radar, the claim vault with forfeiture alerts, and partner access are part of the Genora plan." />
        </div>
      ) : (
        <div className="panel ledger mt-8">
          <Row
            icon={<Landmark />}
            title="Benefits plan"
            value={best ? `${usd(best.total)} back` : "Not set"}
            detail={firstAlloc ? `Elect ${usd(firstAlloc.election)} in ${possessive(firstAlloc.parent)} Dependent Care FSA` : best ? `Claim the ${usd(best.careCredit)} care credit` : "Answer a few questions to build it"}
            action={<Button variant="outline" nativeButton={false} render={<Link href="/reveal" />}>See the math</Button>}
          />
          <Row
            icon={<Camera />}
            title="FSA claims"
            value={claims.recommended ? "Not enrolled yet" : claims.forfeitRisk > 0 ? `${usd(claims.forfeitRisk)} at risk` : `${usd(claims.logged)} claimed`}
            detail={
              claims.recommended
                ? `Elect ${usd(claims.election)} at open enrollment. Log receipts as you pay, so claims are ready on day one.`
                : claims.forfeitRisk > 0
                ? `Log childcare receipts before ${day(claims.deadline, { month: "long", day: "numeric", year: "numeric" })} to use your ${usd(claims.election)} election.`
                : `${usd(claims.remaining)} of ${usd(claims.election)} left to claim${claims.waiting ? ` · ${usd(claims.waiting)} ready to submit` : ""}.`
            }
            action={<Button nativeButton={false} render={<Link href="/app/claims" />}><Camera />Add a receipt</Button>}
          />
          <Row
            icon={<CalendarDays />}
            title="School breaks"
            value={next ? `${day(next.date, { weekday: "short", month: "short", day: "numeric" })}` : coverage.result ? "All covered" : "No calendar yet"}
            detail={
              next
                ? `${next.label} · ${next.cover === "pto" ? `${next.who === "You" ? "your" : `${next.who}'s`} PTO` : next.cover === "camp" ? "day camp" : "sitter"} · ${upcoming.length} no-school days ahead`
                : "Paste the school calendar to see who covers each day."
            }
            action={<Button variant="outline" nativeButton={false} render={<Link href="/app/coverage" />}>Plan breaks</Button>}
          />
        </div>
      )}

      {pro && plan && plan.result.actions.length > 1 && (
        <section aria-labelledby="next" className="mt-10">
          <h2 id="next" className="text-lg font-bold text-ink">Your next steps</h2>
          <ol className="mt-4 space-y-4">
            {plan.result.actions.map((a, i) => (
              <li key={a.id} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="flex size-8 items-center justify-center rounded-full border border-ink/15 text-sm font-semibold text-ink tabular">{i + 1}</span>
                <div>
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
