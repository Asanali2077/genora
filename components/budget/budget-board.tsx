"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { Budget, Profile } from "@/lib/domain/profile";
import type { Assignment } from "@/lib/engine/coverage";
import { BASE_SCENARIO, DEFAULTS, forecastBudget, hasBudget, type LineKind, type Scenario } from "@/lib/engine/budget";
import { track } from "@/lib/analytics";
import { CountUp } from "@/components/motion";
import { MoneyInput } from "@/components/onboarding/fields";
import { Locked } from "@/components/app/locked";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ForecastChart } from "./forecast-chart";

const usd = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const KIND: Record<LineKind, { label: string; dot: string }> = {
  income: { label: "Pay", dot: "bg-brand" },
  benefit: { label: "Benefits", dot: "bg-sun" },
  tax: { label: "Tax credits", dot: "bg-sky-strong" },
  fixed: { label: "Bills", dot: "bg-ink/40" },
  care: { label: "Childcare", dot: "bg-bad" },
  season: { label: "Seasonal", dot: "bg-brand" },
  sick: { label: "Sick days", dot: "bg-ink" },
};
const FIELDS: { key: keyof Budget; label: string; hint?: string }[] = [
  { key: "housing", label: "Rent or mortgage" },
  { key: "groceries", label: "Groceries & household" },
  { key: "transport", label: "Car, gas, transit" },
  { key: "utilities", label: "Utilities, phone, internet" },
  { key: "insurance", label: "Insurance & health" },
  { key: "debt", label: "Loans & card payments" },
  { key: "other", label: "Everything else", hint: "Dining, subscriptions, kids' activities" },
];

function Slider({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm"><span className="font-medium text-ink/80">{label}</span><span className="font-heading font-bold text-ink tabular">{value > 0 ? "+" : ""}{value}{suffix}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[var(--brand)]" />
    </label>
  );
}

export function BudgetBoard({ profile, coverage, ptoUsed, today, pro }: { profile: Profile; coverage: Assignment[]; ptoUsed: Record<string, number>; today: string; pro: boolean }) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget>(profile.budget);
  const [sc, setSc] = useState<Scenario>(BASE_SCENARIO);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const live = useMemo(() => ({ ...profile, budget }), [profile, budget]);
  // Stay in setup until the family saves, so the form doesn't vanish while they type.
  const [setupMode, setSetupMode] = useState(!hasBudget(profile));
  const f = useMemo(() => forecastBudget(live, { today, coverage, ptoUsed, scenario: sc }), [live, today, coverage, ptoUsed, sc]);
  const month = f.months[selected];
  const adults = profile.filingStatus === "mfj" ? 2 : 1;
  const stressed = sc.incomeChangePct !== 0 || sc.careChangePct !== 0 || sc.extraSickDays !== 0 || !sc.usePlan;

  async function save(next: Budget) {
    setSaving("saving");
    const res = await fetch("/api/budget", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ budget: next }) });
    setSaving(res.ok ? "saved" : "idle");
    if (res.ok) {
      setSetupMode(!hasBudget({ ...profile, budget: next }));
      track("budget_saved");
      router.refresh();
      setTimeout(() => setSaving("idle"), 1800);
    }
  }
  const set = (key: keyof Budget) => (v: number) => setBudget((b) => ({ ...b, [key]: v }));

  const setup = (
    <section aria-labelledby="setup" className="panel overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-5 py-4 sm:px-6">
        <div>
          <h2 id="setup" className="font-heading text-lg font-bold text-ink">Your monthly bills</h2>
          <p className="text-sm text-muted-foreground">Rough numbers are fine. Pay, taxes, childcare and benefits are already filled in from your family plan.</p>
        </div>
        <Button disabled={saving === "saving"} onClick={() => save(budget)}>{saving === "saved" ? <Check /> : null}{saving === "saved" ? "Saved" : saving === "saving" ? "Saving…" : "Save budget"}</Button>
      </header>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {FIELDS.map((fl) => <MoneyInput key={fl.key} id={`b-${fl.key}`} label={fl.label} hint={fl.hint} value={budget[fl.key]} onChange={set(fl.key)} />)}
        <MoneyInput id="b-savings" label="Cash in the bank today" hint="Checking + savings" value={budget.savings} onChange={set("savings")} />
      </div>
      <div className="border-t border-ink/[0.07] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Once-a-year costs</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setBudget((b) => ({ ...b, holidays: b.holidays || DEFAULTS.holidaysPerAdult * adults, backToSchool: b.backToSchool || DEFAULTS.backToSchoolPerHousehold }))}
          >
            <Sparkles />Fill typical US amounts
          </Button>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <MoneyInput id="b-holidays" label="Winter holidays" hint="Gifts, food, travel (Nov–Dec)" value={budget.holidays} onChange={set("holidays")} />
          <MoneyInput id="b-vacation" label="Summer vacation" hint="July" value={budget.vacation} onChange={set("vacation")} />
          <MoneyInput id="b-school" label="Back to school" hint="Clothes, supplies (August)" value={budget.backToSchool} onChange={set("backToSchool")} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Typical amounts: ${DEFAULTS.holidaysPerAdult} per adult for winter holidays and ${DEFAULTS.backToSchoolPerHousehold} per household for back to school (
          <a href={DEFAULTS.sources.holidays} target="_blank" rel="noreferrer" className="underline">NRF 2025 surveys</a>).
        </p>
      </div>
    </section>
  );

  if (setupMode) {
    return (
      <div className="space-y-6">
        <div className="inset p-5 text-ink">
          <p className="font-heading text-lg font-bold">Add your bills to see the next 12 months</p>
          <p className="mt-1 text-sm text-muted-foreground">Genora already knows your take-home pay ({usd(f.monthlyTakeHome)} a month after taxes), childcare, tax credits, school breaks and sick season.</p>
        </div>
        {setup}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="headline">
        <h2 id="headline" className="max-w-3xl font-heading text-[1.9rem] font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-[2.4rem]">
          {f.shortfallMonths > 0 ? (
            <>Money gets tight in <span className="marker">{f.lowest.label}</span>: you&apos;d be {usd(f.bufferNeeded)} short.</>
          ) : (
            <>You stay ahead all year. Lowest point: <span className="marker tabular">{usd(f.lowest.balance)}</span> in {f.lowest.label}.</>
          )}
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Take-home pay", `${usd(f.monthlyTakeHome)} / mo`, "after federal, FICA and state tax"],
            ["Balance in 12 months", usd(f.endBalance), `${f.endBalance >= f.startBalance ? "up" : "down"} ${usd(Math.abs(f.endBalance - f.startBalance))} from today`],
            ["Benefits & tax credits", usd(f.totals.benefit + f.totals.tax), "added by the rules this year"],
            ["Childcare, all in", usd(-f.totals.care - f.totals.sick), "care, school breaks and sick days"],
          ].map(([label, value, note], i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="panel p-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-heading text-xl font-bold text-ink tabular">{value}</dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
            </motion.div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <section aria-labelledby="chart" className="panel p-5 sm:p-6">
          <h2 id="chart" className="font-heading text-lg font-bold text-ink">Your next 12 months{stressed && <span className="ml-2 rounded-full bg-sun/30 px-2 py-0.5 text-xs font-bold text-ink">stress test on</span>}</h2>
          <div className="mt-4"><ForecastChart months={f.months} selected={selected} onSelect={setSelected} /></div>
        </section>

        <section aria-labelledby="month" className="panel overflow-hidden" aria-live="polite">
          <header className="flex items-baseline justify-between border-b border-ink/[0.07] px-5 py-4">
            <h2 id="month" className="font-heading text-lg font-bold text-ink">{month.label}</h2>
            <span className={cn("font-heading font-bold tabular", month.net >= 0 ? "text-brand" : "text-bad")}>{month.net >= 0 ? "+" : ""}{usd(month.net)}</span>
          </header>
          <AnimatePresence mode="wait">
            <motion.ul key={month.ym} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="ledger max-h-[22rem] overflow-y-auto">
              {month.lines.map((l) => (
                <li key={l.label + l.amount} className="flex items-start justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="flex items-start gap-2.5">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND[l.kind].dot)} aria-hidden />
                    <span><span className="text-ink">{l.label}</span>{l.note && <span className="block text-xs text-muted-foreground">{l.note}</span>}</span>
                  </span>
                  <span className={cn("shrink-0 font-semibold tabular", l.amount >= 0 ? "text-brand" : "text-ink")}>{l.amount >= 0 ? "+" : ""}{usd(l.amount)}</span>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
          <footer className="flex justify-between border-t border-ink/[0.07] bg-wash px-5 py-3 text-sm">
            <span className="text-muted-foreground">Balance at month end</span>
            <span className={cn("font-heading font-bold tabular", month.balance < 0 ? "text-destructive" : "text-ink")}>{usd(month.balance)}</span>
          </footer>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="rules" className="panel overflow-hidden">
          <h2 id="rules" className="border-b border-ink/[0.07] px-5 py-4 font-heading text-lg font-bold text-ink sm:px-6">What the rules do to your budget</h2>
          <ul className="ledger">
            {f.effects.map((e, i) => (
              <motion.li key={e.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex items-start justify-between gap-4 px-5 py-3.5 sm:px-6">
                <div>
                  <p className="font-semibold text-ink">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.detail}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand">{e.when}</p>
                </div>
                {e.amount !== 0 && <span className={cn("shrink-0 font-heading font-bold tabular", e.amount > 0 ? "text-brand" : "text-bad")}>{e.amount > 0 ? "+" : ""}{usd(e.amount)}</span>}
              </motion.li>
            ))}
          </ul>
        </section>

        {pro ? (
          <section aria-labelledby="stress" className="panel p-5 sm:p-6">
            <h2 id="stress" className="font-heading text-lg font-bold text-ink">Stress-test the year</h2>
            <p className="text-sm text-muted-foreground">Change an assumption; the forecast above recalculates instantly.</p>
            <div className="mt-5 space-y-5" onPointerUp={() => track("budget_stress_test")}>
              <Slider label="Household pay" value={sc.incomeChangePct} min={-30} max={20} step={5} suffix="%" onChange={(v) => setSc({ ...sc, incomeChangePct: v })} />
              <Slider label="Childcare prices" value={sc.careChangePct} min={0} max={30} step={5} suffix="%" onChange={(v) => setSc({ ...sc, careChangePct: v })} />
              <Slider label="Extra sick days" value={sc.extraSickDays} min={0} max={25} step={1} suffix=" days" onChange={(v) => setSc({ ...sc, extraSickDays: v })} />
              <button type="button" role="switch" aria-checked={sc.usePlan} onClick={() => setSc({ ...sc, usePlan: !sc.usePlan })} className={cn("flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left", sc.usePlan ? "border-brand bg-wash" : "border-ink/12 bg-white")}>
                <span><span className="block text-sm font-semibold text-ink">Use Genora&apos;s benefits plan</span><span className="block text-xs text-muted-foreground">Turn off to see the year with your current elections</span></span>
                <span aria-hidden className={cn("relative h-6 w-10 rounded-full transition-colors", sc.usePlan ? "bg-brand" : "bg-ink/15")}><span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", sc.usePlan ? "left-[18px]" : "left-0.5")} /></span>
              </button>
              {stressed && <Button variant="ghost" size="sm" onClick={() => setSc(BASE_SCENARIO)}>Reset to my plan</Button>}
            </div>
            <p className="mt-5 text-sm text-ink">Balance in 12 months: <CountUp key={f.endBalance} value={Math.abs(f.endBalance)} prefix={f.endBalance < 0 ? "−$" : "$"} duration={0.5} className="font-heading font-bold tabular" /></p>
          </section>
        ) : (
          <Locked title="Stress-test your year" body="What if daycare goes up 10%, one of you loses a month of pay, or sick season is brutal? See the answer before it happens. Included in the Genora plan." />
        )}
      </div>

      <details className="group">
        <summary className="inline-flex cursor-pointer items-center text-sm font-semibold text-brand">Edit my bills and yearly costs</summary>
        <div className="mt-4">{setup}</div>
      </details>
      <p className="text-xs text-muted-foreground">
        Sick days use illness rates by age ({" "}
        <a href={DEFAULTS.sources.illness} target="_blank" rel="noreferrer" className="underline">cohort data</a>) × {DEFAULTS.daysPerIllness} days at home, covered first by spare PTO and backup care, then a sitter at ${DEFAULTS.sitterPerDay} a day. Tax amounts are 2026 federal estimates plus a flat state estimate.
      </p>
    </div>
  );
}
