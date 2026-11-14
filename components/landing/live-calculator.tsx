"use client";

import { useMemo, useState } from "react";
import { ProfileSchema } from "@/lib/domain/profile";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { landing } from "@/config/site";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function Field({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-semibold">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer accent-[var(--pine)]"
      />
    </label>
  );
}

/** Runs the real 2026 engine in the browser for a simplified two-parent household. */
export function LiveCalculator() {
  const [income, setIncome] = useState(140_000);
  const [kids, setKids] = useState(2);
  const [care, setCare] = useState(18_000);

  const result = useMemo(() => {
    const profile = ProfileSchema.parse({
      filingStatus: "mfj",
      state: "TX",
      parents: [
        { label: "Parent 1", earnedIncome: income * 0.6, employerOffersDcfsa: true, currentElection: 0 },
        { label: "Parent 2", earnedIncome: income * 0.4, employerOffersDcfsa: true, currentElection: 0 },
      ],
      children: Array.from({ length: kids }, (_, i) => ({ birthYear: 2022 - i * 2 })),
      childcare: { daycare: care },
    });
    return analyzeBenefits(profile);
  }, [income, kids, care]);

  const best = result.optimal;
  const verdict =
    best.election === 0 ? "Skip the FSA, take the tax credit" : best.careCredit > 0 ? `Split: ${usd(best.election)} FSA + the credit` : `Max the FSA at ${usd(best.election)}`;

  return (
    <section aria-labelledby="calc-title" className="rounded-2xl border-2 border-pine/15 bg-card p-5 shadow-[0_18px_40px_-24px_rgba(15,92,77,0.45)] sm:p-6">
      <h2 id="calc-title" className="text-lg font-bold">{landing.calculatorTitle}</h2>
      <div className="mt-5 space-y-5">
        <Field label="Household income" value={income} min={60_000} max={260_000} step={5_000} onChange={setIncome} format={usd} />
        <Field label="Yearly childcare" value={care} min={3_000} max={40_000} step={500} onChange={setCare} format={usd} />
        <div>
          <span className="text-sm text-muted-foreground">Kids under 13</span>
          <div role="radiogroup" aria-label="Kids under 13" className="mt-2 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={kids === n}
                onClick={() => setKids(n)}
                className={`tap rounded-lg border text-sm font-semibold transition-colors ${kids === n ? "border-pine bg-pine text-white" : "hover:border-pine/50"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-muted p-4" aria-live="polite">
        <p className="text-sm text-muted-foreground">Best 2026 plan for this family</p>
        <p className="mt-1 font-heading text-4xl font-extrabold tabular">
          <span className="marker">{usd(best.total)}</span>
          <span className="ml-2 text-base font-medium text-muted-foreground">a year back</span>
        </p>
        <p className="mt-2 text-sm font-semibold text-pine">{verdict}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          vs {usd(result.current.total)} if you only claim the credit — {usd(result.foundMoney)} more.
        </p>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{landing.calculatorNote}</p>
    </section>
  );
}
