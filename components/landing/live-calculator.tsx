"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProfileSchema } from "@/lib/domain/profile";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { landing } from "@/config/site";
import { cn } from "@/lib/utils";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Counts toward a new value when the user changes an input (respects reduced motion). */
function useCountTo(target: number) {
  const [shown, setShown] = useState(target);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const from = useRef(target);
  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 420);
      const v = a + (target - a) * (1 - Math.pow(1 - k, 3));
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return reduced ? target : shown;
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink/80">{label}</span>
        <span className="font-heading text-base font-extrabold text-ink tabular">{usd(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--pine)]"
        style={{ background: `linear-gradient(to right, var(--pine) ${pct}%, rgb(23 42 38 / 0.12) ${pct}%)` }}
      />
    </label>
  );
}

/** Runs the real 2026 engine in the browser for a simplified two-parent household. */
export function LiveCalculator() {
  const [income, setIncome] = useState(140_000);
  const [kids, setKids] = useState(1);
  const [care, setCare] = useState(18_000);
  const [state, setState] = useState<"CA" | "TX">("CA");

  const result = useMemo(() => {
    const profile = ProfileSchema.parse({
      filingStatus: "mfj",
      state,
      parents: [
        { label: "Parent 1", earnedIncome: income * 0.6, employerOffersDcfsa: true, currentElection: 0 },
        { label: "Parent 2", earnedIncome: income * 0.4, employerOffersDcfsa: true, currentElection: 0 },
      ],
      children: Array.from({ length: kids }, (_, i) => ({ birthYear: 2022 - i * 2 })),
      childcare: { daycare: care },
    });
    return analyzeBenefits(profile);
  }, [income, kids, care, state]);

  const best = result.optimal;
  const found = useCountTo(result.foundMoney);
  const verdict =
    best.election === 0 ? "Skip the FSA and take the tax credit" : best.careCredit > 0 ? `Split: ${usd(best.election)} FSA plus the credit` : `Put ${usd(best.election)} in the FSA`;

  return (
    <section aria-labelledby="calc-title" className="panel beam p-5 sm:p-7">
      <h2 id="calc-title" className="text-lg font-bold text-ink">{landing.calculatorTitle}</h2>
      <div className="mt-6 space-y-6">
        <Slider label="Household income" value={income} min={60_000} max={260_000} step={5_000} onChange={setIncome} />
        <Slider label="Childcare per year" value={care} min={3_000} max={40_000} step={500} onChange={setCare} />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Kids under 13", value: kids, options: [1, 2, 3].map((n) => ({ v: n, t: String(n) })), set: (v: number | string) => setKids(Number(v)) },
            { label: "State", value: state, options: [{ v: "CA", t: "California" }, { v: "TX", t: "Texas" }], set: (v: number | string) => setState(v as "CA" | "TX") },
          ].map((g) => (
            <div key={g.label}>
              <span id={`seg-${g.label}`} className="text-sm font-medium text-ink/80">{g.label}</span>
              <div role="radiogroup" aria-labelledby={`seg-${g.label}`} className="mt-2 flex rounded-[11px] bg-[#e6eeeb] p-1">
                {g.options.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={g.value === o.v}
                    onClick={() => g.set(o.v)}
                    className={cn("h-9 flex-1 rounded-[8px] text-sm font-semibold transition-[background-color,color,box-shadow]", g.value === o.v ? "bg-white text-pine shadow-[0_1px_2px_rgba(23,42,38,0.12)]" : "text-muted-foreground hover:text-ink")}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 border-t border-ink/[0.08] pt-6" aria-live="polite">
        <p className="text-sm text-muted-foreground">Money this family leaves on the table</p>
        <p className="mt-1 font-heading text-5xl font-extrabold tracking-tight text-ink tabular">
          <span className="marker">{usd(found)}</span>
          <span className="ml-2 text-base font-semibold tracking-normal text-muted-foreground">a year</span>
        </p>
        <p className="mt-3 text-sm font-semibold text-pine">{verdict}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{usd(best.total)} back in total vs {usd(result.current.total)} with the credit alone.</p>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{landing.calculatorNote}</p>
    </section>
  );
}
