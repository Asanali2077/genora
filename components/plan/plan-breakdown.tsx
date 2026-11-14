import type { BenefitsResult, Scenario } from "@/lib/engine/benefits";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

const ROWS: { key: keyof Scenario; label: string }[] = [
  { key: "election", label: "Dependent Care FSA election" },
  { key: "federalSaved", label: "Federal income tax saved" },
  { key: "ficaSaved", label: "Social Security & Medicare saved" },
  { key: "stateSaved", label: "State tax saved (estimate)" },
  { key: "careCredit", label: "Child & dependent care credit" },
  { key: "forfeitLoss", label: "FSA money forfeited" },
];

export function PlanBreakdown({ result }: { result: BenefitsResult }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Your current setup compared with the best plan</caption>
        <thead>
          <tr className="border-b border-ink/[0.07] text-left text-muted-foreground">
            <th scope="col" className="p-3 font-medium">This year</th>
            <th scope="col" className="p-3 text-right font-medium">Now</th>
            <th scope="col" className="bg-brand/[0.06] p-3 text-right font-semibold text-brand">Best plan</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {ROWS.map((r) => {
            const now = result.current[r.key] as number;
            const best = result.optimal[r.key] as number;
            if (r.key === "forfeitLoss" && now === 0 && best === 0) return null;
            const sign = r.key === "forfeitLoss" ? "−" : "";
            return (
              <tr key={r.key} className="border-b border-ink/[0.07]">
                <th scope="row" className="p-3 text-left font-normal">{r.label}</th>
                <td className="p-3 text-right">{sign}{usd(now)}</td>
                <td className="bg-brand/[0.06] p-3 text-right font-semibold">{sign}{usd(best)}</td>
              </tr>
            );
          })}
          <tr className="font-semibold">
            <th scope="row" className="p-3 text-left">Money back this year</th>
            <td className="p-3 text-right">{usd(result.current.total)}</td>
            <td className="bg-brand/[0.1] p-3 text-right font-heading text-base font-extrabold text-brand">{usd(result.optimal.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ShowMath({ result }: { result: BenefitsResult }) {
  return (
    <details className="panel group">
      <summary className="tap flex cursor-pointer items-center justify-between px-4 py-3 font-semibold">
        Show the math
        <span className="text-sm font-normal text-muted-foreground group-open:hidden">Every number, its formula and the rule</span>
      </summary>
      <dl className="divide-y border-t text-sm">
        {result.math.map((m) => (
          <div key={m.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto]">
            <dt>
              <span className="font-medium">{m.label}</span>
              <span className="block text-muted-foreground">
                {m.formula}
                {m.source && (
                  <>
                    {" · "}
                    <a href={m.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-brand">
                      source
                    </a>
                  </>
                )}
              </span>
            </dt>
            <dd className="tabular font-semibold sm:text-right">{m.value > 0 && m.value < 1 ? pct(m.value) : usd(m.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">Engine {result.engineVersion} · tax year {result.taxYear}</p>
    </details>
  );
}
