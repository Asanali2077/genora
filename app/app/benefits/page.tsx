import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLatestPlan } from "@/lib/services/household";
import { requireHousehold } from "@/lib/services/access";
import { PlanBreakdown, ShowMath } from "@/components/plan/plan-breakdown";
import { possessive } from "@/lib/engine/benefits";
import { CompareBars } from "@/components/plan/compare-bars";
import { WhatIf } from "@/components/plan/what-if";
import { CountUp } from "@/components/motion";
import { ChevronRight } from "lucide-react";
import { SectionTabs } from "@/components/app/section-tabs";
import { TAX_YEAR } from "@/lib/engine/tax-2026";
import { OptimizerChart } from "@/components/plan/optimizer-chart";
import { ProcessStrip } from "@/components/plan/process-strip";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { buildLetters } from "@/lib/engine/paperwork";
import { valueBenefits } from "@/lib/engine/family";
import { BenefitsScanner } from "@/components/plan/benefits-scanner";
import { SAMPLE_GUIDE } from "@/lib/ai/tasks/benefits-guide";
import { TrackView } from "@/components/track-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Taxes & benefits — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default async function BenefitsPage() {
  const { sb, household, pro: subscribed } = await requireHousehold();
  const plan = await getLatestPlan(sb, household.id);
  if (!plan) redirect("/start");

  const r = plan.result;
  // Fresh run for the visual layer (curve + scenario count) — same deterministic engine.
  const live = analyzeBenefits(household.profile);
  const big = r.foundMoney >= 200;
  const [firstAction, ...moreActions] = r.actions;

  const what = (
    <ol className="space-y-3">
      {firstAction && (
        <li className="panel border-l-4 border-l-pine p-5">
          <p className="font-semibold text-ink">{firstAction.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{firstAction.detail}</p>
          <p className="mt-2 text-xs font-semibold text-pine">{firstAction.when}</p>
        </li>
      )}
      {moreActions.map((a) =>
        subscribed ? (
          <li key={a.id} className="panel p-5">
            <p className="font-semibold text-ink">{a.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
            <p className="mt-2 text-xs font-semibold text-pine">{a.when}</p>
          </li>
        ) : (
          <li key={a.id} className="rounded-[18px] border border-dashed border-ink/15 p-5 text-muted-foreground">
            <p className="select-none font-semibold blur-[3px]" aria-hidden>{a.title}</p>
            <p className="mt-1 text-sm">Included in the full plan</p>
          </li>
        ),
      )}
    </ol>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-20 pt-6 md:px-10 md:pt-9">
      <TrackView name="savings_reveal_view" props={{ found_money: r.foundMoney }} />

      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/app" className="hover:text-pine">Today</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>Money</span>
      </nav>
      <p className="font-semibold text-pine">Taxes & benefits · {TAX_YEAR}</p>
      {big ? (
        <h1 className="mt-2 font-heading text-[2.3rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[3.2rem]">
          You&apos;re leaving <CountUp value={r.foundMoney} className="marker tabular" /> a year on the table.
        </h1>
      ) : (
        <h1 className="mt-2 font-heading text-[2.3rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[3.2rem]">
          Your setup is close to the best plan: <CountUp value={r.optimal.total} className="marker tabular" /> back this year.
        </h1>
      )}
      <p className="mt-4 text-lg text-muted-foreground">
        {r.optimal.election > 0
          ? `Best plan: ${r.optimal.allocation.filter((a) => a.election > 0).map((a) => `${usd(a.election)} in ${possessive(a.parent)} FSA`).join(" and ")}${r.optimal.careCredit > 0 ? `, plus a ${usd(r.optimal.careCredit)} care credit` : ""}.`
          : `Best plan: skip the FSA and claim the ${usd(r.optimal.careCredit)} care credit.`}
      </p>
      <div className="mt-7"><CompareBars now={r.current.total} best={r.optimal.total} /></div>

      <div className="mt-8" />
      <SectionTabs sections={[{ id: "do", label: "What to do" }, { id: "compare", label: "Now vs. best" }, { id: "employer", label: "Employer benefits" }, { id: "how", label: "How it's calculated" }, { id: "whatif", label: "What if" }]} />

      <section id="do" aria-labelledby="do-h" className="mt-8 scroll-mt-32">
        <h2 id="do-h" className="font-heading text-xl font-bold text-ink">What to do</h2>
        {r.warnings.length > 0 && (
          <ul className="mt-3 space-y-2">
            {r.warnings.map((w) => (
              <li key={w.id} className="inset border-l-4 border-marigold px-4 py-3 text-sm">
                {w.message}
                {w.amount ? <strong className="tabular"> {usd(w.amount)}</strong> : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">{what}</div>
        {r.childTaxCredit > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Also on your return: a {usd(r.childTaxCredit)} Child Tax Credit for {r.ctcChildren} {r.ctcChildren === 1 ? "child" : "children"} under 17.
          </p>
        )}
      </section>

      <section id="compare" aria-labelledby="compare-h" className="mt-12 scroll-mt-32">
        <h2 id="compare-h" className="font-heading text-xl font-bold text-ink">Now vs. the best plan</h2>
        <div className="mt-3"><PlanBreakdown result={r} /></div>
        <div className="panel mt-4 p-5 sm:p-6">
          <h3 className="font-heading text-lg font-bold text-ink">Why this split wins</h3>
          <p className="mt-1 text-sm text-muted-foreground">Each extra FSA dollar saves tax but shrinks the credit. The best point is where the curve peaks.</p>
          <div className="mt-5"><OptimizerChart curve={live.curve} best={{ election: live.optimal.election, total: live.optimal.total }} current={{ election: live.current.election, total: live.current.total }} /></div>
        </div>
      </section>

      <section id="employer" aria-label="Employer benefits" className="mt-12 scroll-mt-32">
        <BenefitsScanner saved={valueBenefits(household.profile.employerBenefits, 160).rows} sample={SAMPLE_GUIDE} />
      </section>

      <section id="how" aria-labelledby="how-h" className="mt-12 scroll-mt-32">
        <h2 id="how-h" className="font-heading text-xl font-bold text-ink">How it&apos;s calculated</h2>
        <div className="mt-4"><ProcessStrip answers={11} scenarios={live.scenariosTested} best={live.optimal.total} letters={buildLetters(household.profile, live).length} /></div>
        <div className="mt-4"><ShowMath result={r} /></div>
      </section>

      <section id="whatif" aria-label="What if" className="mt-12 scroll-mt-32">
        <WhatIf profile={household.profile} baseline={r.optimal.total} />
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        {subscribed ? (
          <Button size="lg" nativeButton={false} render={<Link href="/app/paperwork" />}>Get the HR letter</Button>
        ) : (
          <Button size="lg" nativeButton={false} render={<Link href="/pricing" />}>Unlock the full plan</Button>
        )}
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/start" />}>Change my answers</Button>
      </div>
    </div>
  );
}