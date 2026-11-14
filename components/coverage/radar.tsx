"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import type { Closure, CoverageResult } from "@/lib/engine/coverage";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { MoneyInput, NumberInput } from "@/components/onboarding/fields";
import { YearStrip } from "./year-strip";
import { CostWaterfall } from "./cost-waterfall";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Settings = { campPerKidPerDay: number; sitterPerDay: number; ptoReserve: number; summerWeeks: number };

export function Radar({ initialClosures, initialResult, sample, today }: { initialClosures: Closure[]; initialResult: CoverageResult | null; sample: string; today: string }) {
  const [raw, setRaw] = useState("");
  const [closures, setClosures] = useState<Closure[]>(initialClosures);
  const [result, setResult] = useState<CoverageResult | null>(initialResult);
  const [settings, setSettings] = useState<Settings>({ campPerKidPerDay: 60, sitterPerDay: 160, ptoReserve: 5, summerWeeks: 10 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Closure>({ start: today, end: today, label: "" });

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coverage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, settings }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setClosures(json.closures);
      setResult(json.result);
      track("break_plan_created", { source: json.source, gap_days: json.result.gapDays });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const recompute = (list: Closure[]) => run({ closures: list, lastDay: null });

  return (
    <div className="space-y-8">
      <section aria-labelledby="paste" className="panel p-5 sm:p-6">
        <h2 id="paste" className="text-lg font-bold">Paste your school calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">Copy it from the district website or PDF. AI reads the dates; the plan below is calculated by Genora.</p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={7}
          placeholder="e.g. Nov 23–27 Thanksgiving break…"
          aria-label="School calendar text"
          className="mt-3 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-pine focus:ring-2 focus:ring-pine/20"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="tap" disabled={busy || !raw.trim()} onClick={() => run({ rawText: raw })}>
            {busy ? "Reading the calendar…" : "Find the gaps"}
          </Button>
          <Button variant="outline" className="tap" disabled={busy} onClick={() => setRaw(sample)}>
            Use a sample calendar
          </Button>
        </div>
        <details className="mt-4">
          <summary className="tap inline-flex cursor-pointer items-center text-sm font-semibold">Costs and PTO settings</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <MoneyInput id="camp" label="Day camp, per child per day" value={settings.campPerKidPerDay} onChange={(v) => setSettings({ ...settings, campPerKidPerDay: v })} />
            <MoneyInput id="sitter" label="Sitter, per day" value={settings.sitterPerDay} onChange={(v) => setSettings({ ...settings, sitterPerDay: v })} />
            <NumberInput id="reserve" label="PTO days each parent keeps for sick days" value={settings.ptoReserve} min={0} max={30} onChange={(v) => setSettings({ ...settings, ptoReserve: v })} />
            <NumberInput id="summer" label="Weeks of summer to cover" value={settings.summerWeeks} min={0} max={14} onChange={(v) => setSettings({ ...settings, summerWeeks: v })} />
          </div>
        </details>
      </section>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {result && (
        <section aria-labelledby="plan" className="space-y-5">
          <h2 id="plan" className="text-2xl font-extrabold leading-tight">
            {result.gapDays} weekdays with no school while you work. Covering them costs <span className="marker tabular">{usd(result.cashCost)}</span>.
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["PTO used", Object.entries(result.ptoUsed).map(([k, v]) => `${k} ${v}`).join(" · ")],
              ["Saved by PTO plan", usd(result.savedByPto)],
              ["Paid care, FSA-eligible", usd(result.fsaEligible)],
              ["Tax saved via FSA", usd(result.fsaTaxSaved)],
            ].map(([k, v]) => (
              <div key={k} className="border-l-4 border-pine/30 pl-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-semibold tabular">{v}</dd>
              </div>
            ))}
          </dl>
          <CostWaterfall result={result} />
          <div className="panel p-5">
            <YearStrip assignments={result.assignments} from={today} />
          </div>
          <Button variant="outline" nativeButton={false} render={<a href="/api/coverage/ics" onClick={() => track("calendar_exported")} />}>
            <CalendarPlus />Add the plan to my calendar
          </Button>
        </section>
      )}

      <section aria-labelledby="dates">
        <h2 id="dates" className="text-lg font-bold">No-school dates ({closures.length})</h2>
        <ul className="panel ledger mt-3">
          {closures.map((c, i) => (
            <li key={`${c.start}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <span>
                <span className="font-medium">{c.label}</span>
                <span className="ml-2 text-muted-foreground tabular">{fmt(c.start)}{c.end !== c.start ? ` – ${fmt(c.end)}` : ""}</span>
              </span>
              <Button variant="ghost" size="sm" className="tap" disabled={busy} onClick={() => recompute(closures.filter((_, j) => j !== i))} aria-label={`Remove ${c.label}`}>
                Remove
              </Button>
            </li>
          ))}
          {closures.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No dates yet. Paste a calendar above or add a date below.</li>}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <label className="text-sm">
            <span className="font-semibold">Add a date</span>
            <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Teacher workday" className="mt-1 h-11 w-full rounded-lg border bg-card px-3" />
          </label>
          <input type="date" aria-label="Start date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value, end: e.target.value > draft.end ? e.target.value : draft.end })} className="h-11 rounded-lg border bg-card px-3" />
          <input type="date" aria-label="End date" value={draft.end} min={draft.start} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className="h-11 rounded-lg border bg-card px-3" />
          <Button variant="outline" className="tap h-11" disabled={busy || !draft.label.trim()} onClick={() => { void recompute([...closures, draft]); setDraft({ start: today, end: today, label: "" }); }}>
            Add
          </Button>
        </div>
      </section>
    </div>
  );
}
