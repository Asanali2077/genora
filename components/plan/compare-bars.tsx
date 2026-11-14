import { GrowBar } from "@/components/motion";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Now vs. best plan as two bars — the same visual language as the landing page. */
export function CompareBars({ now, best }: { now: number; best: number }) {
  const max = Math.max(now, best, 1);
  const rows = [
    { label: "What you get back today", value: now, tone: "bg-ink/25", strong: false },
    { label: "With Genora's plan", value: best, tone: "bg-brand", strong: true },
  ];
  return (
    <div className="panel p-5 sm:p-6">
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className={r.strong ? "font-semibold text-ink" : "text-muted-foreground"}>{r.label}</span>
              <span className="font-heading text-xl font-extrabold text-ink tabular">{usd(r.value)}</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-wash">
              <GrowBar className={`h-full rounded-full ${r.tone}`} pct={(r.value / max) * 100} delay={r.strong ? 0.35 : 0.1} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
