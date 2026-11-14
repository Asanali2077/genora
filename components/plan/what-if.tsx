"use client";

import { useMemo, useState } from "react";
import type { Profile } from "@/lib/domain/profile";
import { analyzeBenefits, possessive } from "@/lib/engine/benefits";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${usd(Math.abs(n))}`;

function Toggle({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => set(!on)}
      className={cn("flex w-full items-center justify-between gap-4 rounded-[12px] border px-4 py-3 text-left transition-colors", on ? "border-pine bg-[#f1f7f5]" : "border-ink/12 bg-white hover:border-pine/40")}
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span aria-hidden className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-pine" : "bg-ink/15")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

/** "What if" planner: re-runs the deterministic engine on the family's profile with changed assumptions. */
export function WhatIf({ profile, baseline }: { profile: Profile; baseline: number }) {
  const cc = profile.childcare;
  const eligibleNow = cc.daycare + cc.preschool + cc.after_school + cc.nanny + cc.day_camp;
  const [care, setCare] = useState(eligibleNow);
  const [raise, setRaise] = useState(0);
  const [baby, setBaby] = useState(false);
  const [bothFsa, setBothFsa] = useState(profile.parents.every((p) => p.employerOffersDcfsa));
  const touched = care !== eligibleNow || raise !== 0 || baby || bothFsa !== profile.parents.every((p) => p.employerOffersDcfsa);

  const result = useMemo(() => {
    const scale = care / Math.max(1, eligibleNow);
    return analyzeBenefits({
      ...profile,
      parents: profile.parents.map((p) => ({ ...p, earnedIncome: Math.round(p.earnedIncome * (1 + raise / 100)), employerOffersDcfsa: bothFsa || p.employerOffersDcfsa, currentElection: 0 })),
      children: baby ? [...profile.children, { name: "", birthYear: 2026 }] : profile.children,
      childcare: eligibleNow > 0
        ? { ...cc, daycare: cc.daycare * scale, preschool: cc.preschool * scale, after_school: cc.after_school * scale, nanny: cc.nanny * scale, day_camp: cc.day_camp * scale }
        : { ...cc, daycare: care },
    });
  }, [profile, care, raise, baby, bothFsa, eligibleNow, cc]);

  const baseCtc = useMemo(() => analyzeBenefits(profile).childTaxCredit, [profile]);
  const best = result.optimal;
  const split = best.allocation.filter((a) => a.election > 0);

  return (
    <section aria-labelledby="whatif" className="panel overflow-hidden">
      <header className="border-b border-ink/[0.07] px-5 py-4 sm:px-6">
        <h2 id="whatif" className="font-heading text-lg font-bold text-ink">What if things change?</h2>
        <p className="text-sm text-muted-foreground">Plan your next open enrollment. Recalculated with 2026 rules as you change each assumption.</p>
      </header>
      <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-5" onPointerUp={() => touched && track("what_if_used")}>
          <label className="block">
            <span className="flex justify-between text-sm"><span className="font-medium text-ink/80">Childcare per year</span><span className="font-heading font-bold text-ink tabular">{usd(care)}</span></span>
            <input type="range" min={0} max={45_000} step={500} value={care} onChange={(e) => setCare(Number(e.target.value))} className="mt-3 w-full accent-[var(--pine)]" />
          </label>
          <label className="block">
            <span className="flex justify-between text-sm"><span className="font-medium text-ink/80">Household pay change</span><span className="font-heading font-bold text-ink tabular">{raise > 0 ? "+" : ""}{raise}%</span></span>
            <input type="range" min={-20} max={30} step={1} value={raise} onChange={(e) => setRaise(Number(e.target.value))} className="mt-3 w-full accent-[var(--pine)]" />
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Toggle label="A new baby" hint="Adds a child under 1" on={baby} set={setBaby} />
            {profile.filingStatus === "mfj" && <Toggle label="Both employers offer an FSA" hint="Lets Genora split across jobs" on={bothFsa} set={setBothFsa} />}
          </div>
        </div>
        <div className="inset flex flex-col justify-between p-5" aria-live="polite">
          <div>
            <p className="text-sm text-muted-foreground">Best plan in this scenario</p>
            <p className="mt-1 font-heading text-4xl font-bold tracking-tight text-ink tabular">{usd(best.total)}</p>
            <p className={cn("mt-1 text-sm font-semibold tabular", best.total >= baseline ? "text-pine" : "text-destructive")}>{signed(best.total - baseline)} vs your plan today</p>
            <p className="mt-3 text-sm text-ink tabular">Child Tax Credit {usd(result.childTaxCredit)}{result.childTaxCredit !== baseCtc && <span className="font-semibold text-pine"> ({signed(result.childTaxCredit - baseCtc)})</span>}</p>
          </div>
          <p className="mt-5 text-sm text-ink">
            {split.length
              ? `Elect ${split.map((a) => `${usd(a.election)} in ${possessive(a.parent)} FSA`).join(" and ")}${best.careCredit > 0 ? `, plus a ${usd(best.careCredit)} credit` : ""}.`
              : best.careCredit > 0 ? `Skip the FSA; claim the ${usd(best.careCredit)} credit.` : "No dependent-care benefit applies."}
            {result.oneTimeExtras.length > 0 && ` Also ${usd(result.oneTimeExtras[0].amount)} Trump Account deposit for the baby.`}
          </p>
        </div>
      </div>
    </section>
  );
}
