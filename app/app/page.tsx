import Link from "next/link";
import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { getLatestPlan } from "@/lib/services/household";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { getLatestCoverage } from "@/lib/services/coverage";
import { TrackView } from "@/components/track-view";
import { Locked } from "@/components/app/locked";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Family money pulse — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/** Seasonal moments that bring the family back (see docs/STRATEGY.md). */
function seasonalNote(month: number, election: number) {
  if (month >= 10) return { title: "Open enrollment is now", body: `Lock in next year's Dependent Care FSA: elect ${usd(election)} before your employer's deadline.` };
  if (month <= 2) return { title: "Tax season", body: "Your Form 2441 summary is ready in Claims. Check every provider has a taxpayer ID." };
  if (month <= 4) return { title: "Summer camps are booking", body: "Day camps are FSA-eligible; overnight camps are not. Plan the summer in School breaks." };
  if (month >= 7 && month <= 8) return { title: "New school year", body: "Paste the new district calendar to plan every break before it starts." };
  return null;
}

export default async function PulsePage() {
  const { sb, household, pro } = await requireHousehold();
  const today = new Date().toISOString().slice(0, 10);
  const [plan, receipts, coverage] = await Promise.all([getLatestPlan(sb, household.id), listReceipts(sb, household.id), getLatestCoverage(sb, household.id)]);
  const claims = claimsSummary(household.profile, receipts, today);
  const upcoming = (coverage.result?.assignments ?? []).filter((a) => a.date >= today).slice(0, 4);
  const season = seasonalNote(new Date().getUTCMonth(), plan?.result.optimal.election ?? 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8">
      <TrackView name="dashboard_view" props={{ pro }} />
      <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
        {plan ? (
          <>This year Genora gets your family <span className="marker tabular">{usd(plan.result.optimal.total)}</span> back.</>
        ) : (
          "Your family money pulse"
        )}
      </h1>
      {plan && plan.result.foundMoney > 0 && (
        <p className="mt-3 text-muted-foreground">{usd(plan.result.foundMoney)} of that is money you were leaving on the table.</p>
      )}

      {season && (
        <div className="mt-6 rounded-xl border-l-4 border-pine bg-card px-5 py-4">
          <p className="font-semibold">{season.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{season.body}</p>
        </div>
      )}

      {!pro ? (
        <div className="mt-8">
          <Locked title="Unlock the full plan" body="School-break radar, the claim vault with forfeiture alerts, and partner access are part of the Genora plan." />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="fsa" className="rounded-xl border bg-card p-5">
            <h2 id="fsa" className="font-bold">FSA claims</h2>
            <p className="mt-3 font-heading text-3xl font-extrabold tabular">{claims.forfeitRisk > 0 ? usd(claims.forfeitRisk) : usd(claims.logged)}</p>
            <p className="text-sm text-muted-foreground">
              {claims.forfeitRisk > 0 ? `at risk of forfeiture by ${claims.deadline}` : `claimed of ${usd(claims.election)}`}
              {claims.waiting > 0 ? ` · ${usd(claims.waiting)} ready to submit` : ""}
            </p>
            <Button variant="outline" className="tap mt-4" nativeButton={false} render={<Link href="/app/claims" />}>Add a receipt</Button>
          </section>

          <section aria-labelledby="breaks" className="rounded-xl border bg-card p-5">
            <h2 id="breaks" className="font-bold">Next days without school</h2>
            {upcoming.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {upcoming.map((a) => (
                  <li key={a.date} className="flex justify-between gap-3">
                    <span>{fmt(a.date)} · {a.label}</span>
                    <span className="font-semibold">{a.cover === "pto" ? `${a.who} PTO` : a.cover === "camp" ? "Day camp" : "Sitter"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Add your school calendar to see who covers each break.</p>
            )}
            <Button variant="outline" className="tap mt-4" nativeButton={false} render={<Link href="/app/coverage" />}>Plan school breaks</Button>
          </section>

          {plan && plan.result.actions.length > 0 && (
            <section aria-labelledby="next" className="rounded-xl border bg-card p-5 md:col-span-2">
              <h2 id="next" className="font-bold">Your next steps</h2>
              <ol className="mt-3 space-y-3">
                {plan.result.actions.map((a) => (
                  <li key={a.id}>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.when}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
