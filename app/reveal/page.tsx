import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { getHousehold, getLatestPlan, isSubscribed } from "@/lib/services/household";
import { PlanBreakdown, ShowMath } from "@/components/plan/plan-breakdown";
import { possessive } from "@/lib/engine/benefits";
import { TrackView } from "@/components/track-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your plan — Genora" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default async function RevealPage() {
  const { sb, user } = await getUser();
  if (!user) redirect("/start");
  const household = await getHousehold(sb, user.id);
  if (!household) redirect("/start");
  const plan = await getLatestPlan(sb, household.id);
  if (!plan) redirect("/start");
  const subscribed = await isSubscribed(sb, household.id);

  const r = plan.result;
  const big = r.foundMoney >= 200;
  const [firstAction, ...moreActions] = r.actions;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-8">
      <TrackView name="savings_reveal_view" props={{ found_money: r.foundMoney }} />

      <p className="text-muted-foreground">Your 2026 childcare money plan</p>
      {big ? (
        <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
          You&apos;re leaving <span className="marker tabular">{usd(r.foundMoney)}</span> a year on the table.
        </h1>
      ) : (
        <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
          Your setup is close to the best plan: <span className="marker tabular">{usd(r.optimal.total)}</span> back this year.
        </h1>
      )}
      <p className="mt-4 text-lg text-muted-foreground">
        {r.optimal.election > 0
          ? `Best plan: ${r.optimal.allocation.filter((a) => a.election > 0).map((a) => `${usd(a.election)} in ${possessive(a.parent)} FSA`).join(" and ")}${r.optimal.careCredit > 0 ? `, plus a ${usd(r.optimal.careCredit)} care credit` : ""}.`
          : `Best plan: skip the FSA and claim the ${usd(r.optimal.careCredit)} care credit.`}
      </p>

      {r.warnings.length > 0 && (
        <ul className="mt-6 space-y-2">
          {r.warnings.map((w) => (
            <li key={w.id} className="rounded-lg border-l-4 border-marigold bg-accent px-4 py-3 text-sm">
              {w.message}
              {w.amount ? <strong className="tabular"> {usd(w.amount)}</strong> : null}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8" aria-labelledby="compare">
        <h2 id="compare" className="text-xl font-bold">Now vs. the best plan</h2>
        <div className="mt-3"><PlanBreakdown result={r} /></div>
      </section>

      <section className="mt-8" aria-labelledby="todo">
        <h2 id="todo" className="text-xl font-bold">What to do</h2>
        <ol className="mt-3 space-y-3">
          {firstAction && (
            <li className="rounded-xl border bg-card p-4">
              <p className="font-semibold">{firstAction.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{firstAction.detail}</p>
              <p className="mt-2 text-xs font-medium text-pine">{firstAction.when}</p>
            </li>
          )}
          {moreActions.map((a) =>
            subscribed ? (
              <li key={a.id} className="rounded-xl border bg-card p-4">
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                <p className="mt-2 text-xs font-medium text-pine">{a.when}</p>
              </li>
            ) : (
              <li key={a.id} className="rounded-xl border border-dashed p-4 text-muted-foreground">
                <p className="select-none font-semibold blur-[3px]" aria-hidden>{a.title}</p>
                <p className="mt-1 text-sm">Included in the full plan</p>
              </li>
            ),
          )}
        </ol>
      </section>

      <div className="mt-8"><ShowMath result={r} /></div>

      {r.childTaxCredit > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Also on your return: a {usd(r.childTaxCredit)} Child Tax Credit for {r.ctcChildren} {r.ctcChildren === 1 ? "child" : "children"} under 17.
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        {subscribed ? (
          <Button size="lg" className="tap h-12 px-6 text-base" nativeButton={false} render={<Link href="/app" />}>Open my dashboard</Button>
        ) : (
          <Button size="lg" className="tap h-12 px-6 text-base" nativeButton={false} render={<Link href="/pricing" />}>Unlock the full plan</Button>
        )}
        <Button size="lg" variant="outline" className="tap h-12 px-6 text-base" nativeButton={false} render={<Link href="/start" />}>Change my answers</Button>
      </div>
    </div>
  );
}
