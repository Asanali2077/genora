import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ChevronRight, LifeBuoy, Lock } from "lucide-react";
import { requireHousehold } from "@/lib/services/access";
import { getLatestPlan } from "@/lib/services/household";
import { claimsSummary, listReceipts } from "@/lib/services/claims";
import { getLatestCoverage } from "@/lib/services/coverage";
import { TAX_YEAR } from "@/lib/engine/tax-2026";
import { TrackView } from "@/components/track-view";
import { DateChip } from "@/components/app/date-chip";
import { KidCards } from "@/components/family/kid-cards";
import { ShareFound } from "@/components/app/share-found";
import { lifeEvents, savingsSummary, valueBenefits } from "@/lib/engine/family";
import { forecastBudget, hasBudget } from "@/lib/engine/budget";
import { nextActions, type NextAction } from "@/lib/engine/actions";
import { pricing } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Today — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const DAY = 86_400_000;
const addDays = (iso: string, d: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * DAY).toISOString().slice(0, 10);
const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Event = { date: string; title: string; detail: string; tone: "pine" | "marigold" | "sky"; href: string };

/** Collapses consecutive no-school days of one break into a single line with who covers what. */
function breaks(list: { date: string; label: string; cover: string; who?: string; cost: number }[]): Event[] {
  const out: (Event & { last: string; days: typeof list })[] = [];
  for (const a of list) {
    const prev = out[out.length - 1];
    if (prev && prev.title.endsWith(a.label) && Date.parse(a.date) - Date.parse(prev.last) <= 4 * DAY) {
      prev.last = a.date;
      prev.days.push(a);
    } else out.push({ date: a.date, last: a.date, days: [a], title: `No school · ${a.label}`, detail: "", tone: "sky", href: "/app/coverage" });
  }
  return out.map(({ last, days, ...e }) => {
    const pto = days.filter((d) => d.cover === "pto").length;
    const paid = days.reduce((s, d) => s + (d.cover === "pto" ? 0 : d.cost), 0);
    const span = days.length > 1 ? `${shortDate(e.date)}–${shortDate(last)}, ` : "";
    return { ...e, detail: `${span}${days.length} day${days.length > 1 ? "s" : ""}: ${pto ? `${pto} on PTO` : ""}${pto && paid ? ", " : ""}${paid ? `${usd(paid)} of FSA-eligible care` : ""}` };
  });
}

const URGENCY: Record<NextAction["urgency"], { label: string; dot: string }> = {
  now: { label: "Now", dot: "bg-marigold" },
  soon: { label: "Soon", dot: "bg-pine" },
  setup: { label: "Set up", dot: "bg-ink/20" },
};

export default async function TodayPage() {
  const { sb, household, pro } = await requireHousehold();
  const profile = household.profile;
  const today = new Date().toISOString().slice(0, 10);
  const [plan, receipts, coverage] = await Promise.all([getLatestPlan(sb, household.id), listReceipts(sb, household.id), getLatestCoverage(sb, household.id)]);
  const claims = claimsSummary(profile, receipts, today);
  const result = plan?.result;
  const best = result?.optimal;
  const firstAlloc = best?.allocation.find((a) => a.election > 0);
  const forecast = forecastBudget(profile, { today, coverage: coverage.result?.assignments, ptoUsed: coverage.result?.ptoUsed });
  const budgetReady = hasBudget(profile);
  const scanned = valueBenefits(profile.employerBenefits, 160);
  const assignments = coverage.result?.assignments ?? [];
  const soon = addDays(today, 60);

  const actions = nextActions({
    today,
    pro,
    foundMoney: result?.foundMoney ?? 0,
    bestElection: best?.election ?? 0,
    electionParent: firstAlloc?.parent,
    hasBudget: budgetReady,
    shortfall: { months: forecast.shortfallMonths, buffer: forecast.bufferNeeded, label: forecast.lowest.label },
    claims: { recommended: claims.recommended, forfeitRisk: claims.forfeitRisk, deadline: claims.deadline, daysToDeadline: claims.daysToDeadline, missingTin: claims.missingTin, receipts: receipts.length },
    hasCalendar: !!coverage.result,
    uncoveredDays: assignments.filter((a) => a.date >= today && a.date <= soon && a.cover !== "pto").length,
    scannedBenefits: profile.employerBenefits.length,
    twoParents: profile.filingStatus === "mfj",
    enrollmentOpen: today.slice(5, 7) >= "10",
  });
  const pressing = actions.filter((a) => a.urgency !== "setup");
  const nextDue = pressing.find((a) => a.due)?.due;

  const savings = savingsSummary(
    [
      { label: "Benefits plan", amount: result?.foundMoney ?? 0 },
      { label: "School-break plan", amount: coverage.result?.savedByPto ?? 0 },
      { label: "Employer benefits", amount: scanned.total },
    ],
    pricing.plans[0].price,
  );

  // The next 90 days, from the family's own data.
  const horizon = addDays(today, 90);
  const events: Event[] = [
    ...breaks(assignments.filter((a) => a.date >= today)).slice(0, 3),
    ...(!claims.recommended && claims.remaining > 0 ? [{ date: claims.deadline, title: "FSA claim deadline", detail: `${usd(claims.remaining)} of your election still to claim`, tone: "marigold" as const, href: "/app/claims" }] : []),
    ...lifeEvents(profile, today, { gracePeriod: profile.gracePeriod }).map((e) => ({ date: e.date, title: e.title, detail: e.detail, tone: (e.kind === "child" ? "marigold" : "pine") as Event["tone"], href: e.kind === "child" ? "/app/family" : "/app/benefits" })),
    ...(result && result.childTaxCredit > 0 ? [{ date: `${TAX_YEAR + 1}-04-15`, title: "Tax day: credits arrive", detail: `${usd(result.childTaxCredit + (best?.careCredit ?? 0))} in Child Tax Credit and care credit`, tone: "pine" as const, href: "/app/budget" }] : []),
  ]
    .filter((e) => e.date <= horizon || e.title.startsWith("Tax day"))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const weekday = new Date().toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const status = budgetReady && forecast.shortfallMonths > 0 ? `Money gets tight in ${forecast.lowest.label}.` : "You're on track this year.";
  const need = pressing.length === 0 ? "Nothing needs you right now." : `${pressing.length} thing${pressing.length > 1 ? "s" : ""} need${pressing.length > 1 ? "" : "s"} you${nextDue ? ` before ${shortDate(nextDue)}` : ""}.`;
  const maxNet = Math.max(1, ...forecast.months.map((m) => Math.abs(m.net)));

  return (
    <div className="px-5 pb-12 pt-6 md:px-10 md:pt-9">
      <TrackView name="dashboard_view" props={{ pro, actions: actions.length }} />
      <p className="text-sm font-semibold text-pine">{weekday}</p>
      <h1 className="mt-2 max-w-3xl font-heading text-[2rem] font-bold leading-[1.08] tracking-[-0.03em] text-ink md:text-[2.7rem]">
        {status} <span className="text-ink/55">{need}</span>
      </h1>

      <div className="mt-8 grid max-w-6xl items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-5">
        {/* Needs you */}
        <section aria-labelledby="needs" className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4 sm:px-6">
            <h2 id="needs" className="font-heading text-lg font-bold text-ink">Needs you</h2>
            <span className="text-sm text-muted-foreground">{actions.length} open</span>
          </header>
          <ol className="divide-y divide-ink/[0.06]">
            {actions.slice(0, 7).map((a) => {
              const locked = a.pro && !pro;
              return (
                <li key={a.id}>
                  <Link href={a.href} className="group flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-ink/[0.02] sm:px-6">
                    <span className={cn("mt-2 size-2.5 shrink-0 rounded-full", URGENCY[a.urgency].dot)} aria-label={URGENCY[a.urgency].label} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-ink">{a.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{a.detail}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        {a.impact > 0 && <span className="rounded-full bg-marigold/25 px-2 py-0.5 text-ink tabular">{usd(a.impact)}</span>}
                        {a.due && <span className="rounded-full bg-pine/[0.08] px-2 py-0.5 text-pine">By {shortDate(a.due)}</span>}
                        {locked && <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2 py-0.5 text-ink/60"><Lock className="size-3" aria-hidden />Genora plan</span>}
                      </span>
                    </span>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-pine" aria-hidden />
                  </Link>
                </li>
              );
            })}
            {actions.length === 0 && <li className="px-6 py-8 text-center text-muted-foreground">All caught up. Genora will add things here as dates get close.</li>}
          </ol>
        </section>

        {/* Coming up */}
        <section aria-labelledby="upcoming" className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4 sm:px-6">
            <h2 id="upcoming" className="font-heading text-lg font-bold text-ink">Coming up</h2>
            <Link href="/app/coverage" className="inline-flex items-center gap-1 text-sm font-semibold text-pine hover:underline">School breaks <ArrowRight className="size-3.5" aria-hidden /></Link>
          </header>
          <ol className="divide-y divide-ink/[0.06]">
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
                No-school days show up here once you add the school calendar. <Link href="/app/coverage" className="font-semibold text-pine">Plan school breaks</Link>
              </li>
            )}
          </ol>
        </section>

        </div>
        <div className="min-w-0 space-y-5">
        {/* Your year in numbers */}
        <section aria-labelledby="year" className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 id="year" className="font-heading text-lg font-bold text-ink">Your {TAX_YEAR} in numbers</h2>
            {savings.total > 0 && <ShareFound amount={savings.total} />}
          </div>
          <dl className="mt-3 divide-y divide-ink/[0.06]">
            {[
              { href: "/app/budget", label: "Take-home pay", value: `${usd(forecast.monthlyTakeHome)}`, unit: "/ month", note: "after federal, FICA and state tax" },
              ...(best ? [{ href: "/app/benefits", label: "Back from tax rules", value: usd(best.total), unit: "/ year", note: result && result.foundMoney > 0 ? `${usd(result.foundMoney)} more than you get today` : "Your setup is already close to the best" }] : []),
              budgetReady
                ? { href: "/app/budget", label: "Lowest balance", value: usd(forecast.lowest.balance), unit: forecast.lowest.label, note: forecast.shortfallMonths > 0 ? `${usd(forecast.bufferNeeded)} short at the worst point` : "You stay above zero all year" }
                : { href: "/app/budget", label: "Lowest balance", value: "—", unit: "", note: "Add your bills to see it" },
            ].map((r) => (
              <div key={r.label}>
                <Link href={r.href} className="group -mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3 hover:bg-ink/[0.02]">
                  <span className="min-w-0 flex-1">
                    <dt className="text-sm text-muted-foreground">{r.label}</dt>
                    <dd className="mt-0.5 font-heading text-2xl font-bold text-ink tabular">
                      {r.value} <span className="text-sm font-medium text-muted-foreground">{r.unit}</span>
                    </dd>
                    <dd className="text-xs text-muted-foreground">{r.note}</dd>
                  </span>
                  <ChevronRight className="size-4 text-ink/30 group-hover:text-pine" aria-hidden />
                </Link>
              </div>
            ))}
          </dl>
          <Link href="/app/budget" className="mt-3 block rounded-[12px] bg-[#f1f5f3] p-3" aria-label="Open the 12-month budget forecast">
            <span className="flex h-12 items-center gap-1" aria-hidden>
              {forecast.months.map((m) => (
                <span key={m.ym} className="flex h-full flex-1 flex-col">
                  <span className="flex h-1/2 items-end">{m.net >= 0 && <span className="w-full rounded-t-[2px] bg-pine" style={{ height: `${Math.max(8, (m.net / maxNet) * 100)}%` }} />}</span>
                  <span className="flex h-1/2 items-start border-t border-ink/10">{m.net < 0 && <span className="w-full rounded-b-[2px] bg-[#d9694f]" style={{ height: `${Math.max(8, (-m.net / maxNet) * 100)}%` }} />}</span>
                </span>
              ))}
            </span>
            <span className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><span>{forecast.months[0].label}</span><span>Next 12 months</span><span>{forecast.months[11].label}</span></span>
          </Link>
          {savings.total > 0 && <p className="mt-3 text-xs text-muted-foreground">Genora found {usd(savings.total)} you weren&apos;t getting: {savings.parts.filter((p) => p.amount > 0).map((p) => `${p.label.toLowerCase()} ${usd(p.amount)}`).join(", ")}.</p>}
        </section>

        {/* Sick day */}
        <Link href="/app/sos" className="group flex items-center gap-4 rounded-[22px] bg-marigold p-5 text-ink transition-transform hover:-translate-y-0.5 sm:p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink/10"><LifeBuoy className="size-6" aria-hidden /></span>
          <span className="flex-1">
            <span className="block font-heading text-xl font-bold leading-tight">Kid sick tomorrow?</span>
            <span className="mt-0.5 block text-sm text-ink/75">Every way to cover the day, ranked by real cost, with the messages ready.</span>
          </span>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
        </div>
      </div>

      <section aria-labelledby="kids" className="mt-10 max-w-6xl">
        <div className="flex items-center justify-between">
          <h2 id="kids" className="font-heading text-lg font-bold text-ink">Your kids</h2>
          <Link href="/app/family" className="text-sm font-semibold text-pine hover:underline">Kids & partner</Link>
        </div>
        <div className="mt-4"><KidCards profile={profile} nextGap={assignments.find((a) => a.date >= today)} /></div>
      </section>
    </div>
  );
}
