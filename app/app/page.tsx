import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Camera, CalendarDays, FileText } from "lucide-react";
import { requireHousehold } from "@/lib/services/access";
import { getLatestPlan } from "@/lib/services/household";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { getLatestCoverage } from "@/lib/services/coverage";
import { possessive } from "@/lib/engine/benefits";
import { TAX_YEAR } from "@/lib/engine/tax-2026";
import { TrackView } from "@/components/track-view";
import { Locked } from "@/components/app/locked";
import { DateChip } from "@/components/app/date-chip";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Overview — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Event = { date: string; title: string; detail: string; tone: "pine" | "marigold" | "sky"; href: string };

export default async function OverviewPage() {
  const { sb, household, pro } = await requireHousehold();
  const today = new Date().toISOString().slice(0, 10);
  const [plan, receipts, coverage] = await Promise.all([getLatestPlan(sb, household.id), listReceipts(sb, household.id), getLatestCoverage(sb, household.id)]);
  const claims = claimsSummary(household.profile, receipts, today);
  const best = plan?.result.optimal;
  const firstAlloc = best?.allocation.find((a) => a.election > 0);
  const monthName = new Date().toLocaleString("en-US", { month: "long", timeZone: "UTC" });

  // Real upcoming events from the family's own plan.
  const events: Event[] = [
    ...(coverage.result?.assignments ?? [])
      .filter((a) => a.date >= today)
      .slice(0, 4)
      .map((a) => ({
        date: a.date,
        title: `No school · ${a.label}`,
        detail: a.cover === "pto" ? `${a.who === "You" ? "Your" : `${a.who}'s`} PTO day` : a.cover === "camp" ? `Day camp · $${a.cost}, FSA-eligible` : `Sitter · $${a.cost}, FSA-eligible`,
        tone: "sky" as const,
        href: "/app/coverage",
      })),
    ...(!claims.recommended ? [{ date: claims.deadline, title: "FSA claim deadline", detail: `${usd(claims.remaining)} of your election still to claim`, tone: "marigold" as const, href: "/app/claims" }] : []),
    { date: `${TAX_YEAR + 1}-04-15`, title: "Tax day", detail: "File Form 2441 with your provider list", tone: "pine" as const, href: "/app/claims" },
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Childcare logged per month this plan year.
  const byMonth = Array.from({ length: 12 }, () => 0);
  for (const r of receipts) if (r.eligible && r.service_from.startsWith(String(TAX_YEAR))) byMonth[Number(r.service_from.slice(5, 7)) - 1] += Number(r.amount);
  const monthlyTarget = claims.election / 12;
  const top = Math.max(monthlyTarget, ...byMonth, 1);

  return (
    <div className="px-5 pb-12 pt-8 md:px-10 md:pt-12">
      <TrackView name="dashboard_view" props={{ pro }} />
      <p className="text-sm font-semibold text-pine">{monthName} at home</p>
      <h1 className="mt-2 max-w-3xl font-heading text-[2.2rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[3rem]">
        {best ? <>Your family gets <span className="marker tabular">{usd(best.total)}</span> back in {TAX_YEAR}.</> : "Your family money overview"}
      </h1>
      {plan && plan.result.foundMoney > 0 && <p className="mt-3 text-lg text-muted-foreground">{usd(plan.result.foundMoney)} of it is money you were leaving on the table.</p>}

      {!pro ? (
        <div className="mt-8 max-w-4xl"><Locked title="Unlock the full plan" body="School-break radar, the claim vault with forfeiture alerts, ready-to-send paperwork and partner access are part of the Genora plan." /></div>
      ) : (
        <div className="mt-9 grid max-w-6xl gap-6 xl:grid-cols-[1.15fr_1fr]">
          <section aria-labelledby="upcoming" className="panel overflow-hidden">
            <header className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4 sm:px-6">
              <h2 id="upcoming" className="font-heading text-lg font-bold text-ink">Coming up</h2>
              <Link href="/app/coverage" className="text-sm font-semibold text-pine hover:underline">Full calendar</Link>
            </header>
            <ol className="ledger">
              {events.map((e) => (
                <li key={`${e.date}-${e.title}`}>
                  <Link href={e.href} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ink/[0.02] sm:px-6">
                    <DateChip iso={e.date} tone={e.tone} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{e.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{e.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {!coverage.result && (
                <li className="px-5 py-4 text-sm text-muted-foreground sm:px-6">
                  Add your school calendar to see every no-school day here. <Link href="/app/coverage" className="font-semibold text-pine">Plan school breaks</Link>
                </li>
              )}
            </ol>
          </section>

          <div className="space-y-6">
            <section aria-labelledby="fsa" className="panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="fsa" className="text-sm font-semibold text-muted-foreground">Dependent Care FSA</h2>
                  <p className="mt-1 font-heading text-[1.7rem] font-bold leading-tight text-ink tabular">
                    {claims.recommended ? `Elect ${usd(claims.election)}` : claims.forfeitRisk > 0 ? `${usd(claims.forfeitRisk)} at risk` : `${usd(claims.logged)} claimed`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {claims.recommended ? "at open enrollment — receipts you log now are ready on day one" : `of ${usd(claims.election)} · ${claims.daysToDeadline} days to the deadline`}
                  </p>
                </div>
                <Button size="sm" nativeButton={false} render={<Link href="/app/claims" />}><Camera />Receipt</Button>
              </div>
              <div className="mt-6 flex h-28 items-end gap-1.5" role="img" aria-label="Childcare logged per month">
                {byMonth.map((v, i) => (
                  <div key={MONTHS[i]} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="relative flex h-24 w-full items-end">
                      <div className="absolute inset-x-0 border-t border-dashed border-ink/20" style={{ bottom: `${(monthlyTarget / top) * 100}%` }} />
                      <div className={`w-full rounded-t-[4px] ${v > 0 ? "bg-pine" : "bg-ink/[0.06]"}`} style={{ height: `${Math.max(4, (v / top) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{MONTHS[i].slice(0, 1)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Bars: childcare logged per month. Dashed line: monthly pace to use the full election.</p>
            </section>

            <section aria-labelledby="todo" className="panel p-5 sm:p-6">
              <h2 id="todo" className="font-heading text-lg font-bold text-ink">Do this next</h2>
              <ul className="mt-4 space-y-3">
                {firstAlloc && (
                  <li>
                    <Link href="/app/paperwork" className="group flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-[10px] bg-pine/[0.08] text-pine"><FileText className="size-[18px]" /></span>
                      <span className="flex-1 text-[15px] text-ink">Send HR your {usd(firstAlloc.election)} election for {possessive(firstAlloc.parent)} FSA</span>
                      <ArrowUpRight className="size-4 text-ink/40 group-hover:text-pine" aria-hidden />
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/app/coverage" className="group flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-[10px] bg-pine/[0.08] text-pine"><CalendarDays className="size-[18px]" /></span>
                    <span className="flex-1 text-[15px] text-ink">{coverage.result ? "Add the school-break plan to your calendar" : "Paste your school calendar"}</span>
                    <ArrowUpRight className="size-4 text-ink/40 group-hover:text-pine" aria-hidden />
                  </Link>
                </li>
                {claims.missingTin.length > 0 && (
                  <li>
                    <Link href="/app/paperwork" className="group flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-[10px] bg-marigold/25 text-ink"><FileText className="size-[18px]" /></span>
                      <span className="flex-1 text-[15px] text-ink">Ask {claims.missingTin[0]} for their taxpayer ID</span>
                      <ArrowUpRight className="size-4 text-ink/40 group-hover:text-pine" aria-hidden />
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
