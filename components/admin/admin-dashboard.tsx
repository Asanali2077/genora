"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FunnelData } from "@/lib/funnel";
import { calcEconomics, type EconInput } from "@/lib/econ";
import { quizConfig } from "@/config/quiz.config";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STAGE_LABEL: Record<string, { ru: string; en: string }> = {
  landing_view: { ru: "Лендинг", en: "Landing" },
  quiz_start: { ru: "Старт квиза", en: "Quiz start" },
  quiz_complete: { ru: "Квиз пройден", en: "Quiz done" },
  result_view: { ru: "Результат", en: "Result" },
  paywall_view: { ru: "Пейволл", en: "Paywall" },
  purchase: { ru: "Покупка", en: "Purchase" },
};
const tooltipStyle = { background: "oklch(0.2 0.016 195)", border: "1px solid oklch(1 0 0 / 0.12)", borderRadius: 12, color: "oklch(0.96 0.01 95)" };

function Card({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-heading text-2xl font-extrabold", tone === "good" && "text-mint", tone === "bad" && "text-destructive")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[var(--primary)]" />
    </label>
  );
}

export function AdminDashboard({ data, econ }: { data: FunnelData; econ: EconInput & { currency: string } }) {
  const { t, loc, locale } = useI18n();
  const [inp, setInp] = useState<EconInput>(econ);
  const r = useMemo(() => calcEconomics(inp), [inp]);
  const cur = econ.currency;
  const money = (n: number) => (Number.isFinite(n) ? `${cur}${n.toFixed(n < 10 ? 2 : 0)}` : "∞");
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const set = <K extends keyof EconInput>(k: K) => (v: number) => setInp((p) => ({ ...p, [k]: v }));
  const stepTitle = (id: string) => { const s = quizConfig.steps.find((x) => x.id === id); return s ? loc(s.title) : id; };

  const funnel = data.stages.map((s) => ({ ...s, name: STAGE_LABEL[s.key]?.[locale] ?? s.key }));
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-1)", "var(--chart-2)"];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{t("admin.title")}</h1>
        {data.usingSeed && <span className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs text-ember">{t("common.demoBadge")} · seed</span>}
      </header>

      <section aria-label={t("admin.metrics")} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label={locale === "ru" ? "Посетители" : "Visitors"} value={data.totals.visitors.toLocaleString()} />
        <Card label={locale === "ru" ? "Прошли квиз" : "Quiz completion"} value={`${data.totals.quizCompletion}%`} />
        <Card label={locale === "ru" ? "Покупок" : "Purchases"} value={data.totals.purchases.toLocaleString()} hint={`${data.totals.crVisitorToPaid}% CR`} tone="good" />
        <Card label={locale === "ru" ? "Выручка" : "Revenue"} value={`${cur}${Math.round(data.totals.revenue).toLocaleString()}`} />
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-4 font-heading text-lg font-bold">{t("admin.funnel")}</h2>
        <div className="h-72" role="img" aria-label={t("admin.funnel")}>
          <ResponsiveContainer>
            <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 36 }}>
              <CartesianGrid horizontal={false} stroke="oklch(1 0 0 / 0.06)" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={96} tick={{ fill: "oklch(0.72 0.02 195)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} formatter={(v, _n, p) => [`${v} (${p.payload.pct}%)`, ""]} />
              <Bar dataKey="count" isAnimationActive={false} radius={[0, 10, 10, 0]} label={{ position: "right", fill: "oklch(0.96 0.01 95)", fontSize: 12 }}>
                {funnel.map((_, i) => <Cell key={i} fill={palette[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass rounded-3xl p-4">
          <h2 className="mb-3 font-heading text-lg font-bold">{locale === "ru" ? "Отвал по шагам квиза" : "Quiz drop-off by step"}</h2>
          <ul className="space-y-3">
            {data.steps.map((s) => (
              <li key={s.id} className="text-sm">
                <div className="flex justify-between gap-3"><span className="truncate text-foreground/85">{stepTitle(s.id)}</span><span className={cn("tabular-nums", s.dropPct > 15 ? "text-destructive" : "text-muted-foreground")}>−{s.dropPct}%</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${100 - s.dropPct}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-3xl p-4">
          <h2 className="mb-3 font-heading text-lg font-bold">A/B {locale === "ru" ? "пейволла" : "paywall"}</h2>
          <div className="grid grid-cols-2 gap-3">
            {(["a", "b"] as const).map((v) => (
              <div key={v} className="rounded-2xl border border-white/10 p-3">
                <p className="text-xs uppercase text-muted-foreground">{locale === "ru" ? "Вариант" : "Variant"} {v.toUpperCase()}</p>
                <p className="mt-1 font-heading text-2xl font-extrabold text-primary">{data.variants[v].cr}%</p>
                <p className="text-xs text-muted-foreground">{data.variants[v].purchases} / {data.variants[v].paywall}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-36">
            <ResponsiveContainer>
              <LineChart data={data.daily}>
                <XAxis dataKey="day" tick={{ fill: "oklch(0.72 0.02 195)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="visitors" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="purchases" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-4 font-heading text-lg font-bold">{t("admin.econ")}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-4">
            <Slider label="CAC" value={inp.cac} min={0.5} max={30} step={0.5} onChange={set("cac")} fmt={money} />
            <Slider label={locale === "ru" ? "CR в триал" : "CR to trial"} value={inp.crToTrial} min={0.02} max={0.6} step={0.01} onChange={set("crToTrial")} fmt={pct} />
            <Slider label={locale === "ru" ? "CR триал → оплата" : "CR trial → paid"} value={inp.crTrialToPaid} min={0.05} max={0.9} step={0.01} onChange={set("crTrialToPaid")} fmt={pct} />
            <Slider label={locale === "ru" ? "Цена / мес" : "Price / mo"} value={inp.monthlyPrice} min={1} max={50} step={0.5} onChange={set("monthlyPrice")} fmt={money} />
            <Slider label={locale === "ru" ? "Churn / мес" : "Churn / mo"} value={inp.monthlyChurn} min={0.02} max={0.5} step={0.01} onChange={set("monthlyChurn")} fmt={pct} />
            <Slider label={locale === "ru" ? "Маржа" : "Gross margin"} value={inp.grossMargin} min={0.3} max={0.95} step={0.01} onChange={set("grossMargin")} fmt={pct} />
          </div>
          <div className="grid grid-cols-2 content-start gap-3">
            <Card label="LTV" value={money(r.ltv)} hint={`${r.lifetimeMonths.toFixed(1)} ${locale === "ru" ? "мес жизни" : "mo lifetime"}`} />
            <Card label="LTV / CAC" value={r.ltvCac.toFixed(2)} tone={r.verdict === "great" ? "good" : r.verdict === "bad" ? "bad" : undefined} hint={r.verdict === "great" ? "≥ 3 ✓" : "target ≥ 3"} />
            <Card label={locale === "ru" ? "CAC платящего" : "Paid CAC"} value={money(r.cacPaid)} hint={`${pct(r.payRate)} ${locale === "ru" ? "в оплату" : "to paid"}`} />
            <Card label={locale === "ru" ? "Окупаемость" : "Payback"} value={Number.isFinite(r.paybackMonths) ? `${r.paybackMonths.toFixed(1)} ${locale === "ru" ? "мес" : "mo"}` : "∞"} />
            <Card label="ARPU / mo" value={money(r.arpu)} />
          </div>
        </div>
      </section>
    </div>
  );
}
