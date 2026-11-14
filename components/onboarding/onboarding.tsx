"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileSchema, type CareCategory } from "@/lib/domain/profile";
import { analyzeBenefits } from "@/lib/engine/benefits";
import { STATE_RATES } from "@/lib/engine/tax-2026";
import { ensureSession } from "@/lib/supabase/browser";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Choice, MoneyInput, NumberInput, YesNo } from "./fields";

type Draft = {
  filingStatus: "mfj" | "single" | "hoh";
  state: string;
  parents: { label: string; earnedIncome: number; employerOffersDcfsa: boolean; currentElection: number; backupCare: number; ptoDays: number }[];
  children: { name: string; birthYear: number }[];
  childcare: Record<CareCategory, number>;
  paysRelative: boolean;
  gracePeriod: boolean;
  trumpAccountElected: boolean;
};

const parent = (label: string, earnedIncome: number) => ({ label, earnedIncome, employerOffersDcfsa: true, currentElection: 0, backupCare: 0, ptoDays: 15 });
const initial: Draft = {
  filingStatus: "mfj",
  state: "TX",
  parents: [parent("You", 85_000), parent("Partner", 55_000)],
  children: [{ name: "", birthYear: 2022 }],
  childcare: { daycare: 0, preschool: 0, after_school: 0, nanny: 0, day_camp: 0, overnight_camp: 0 },
  paysRelative: false,
  gracePeriod: false,
  trumpAccountElected: false,
};

const KEY = "genora_onboarding";
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const CARE: { key: CareCategory; label: string; hint?: string }[] = [
  { key: "daycare", label: "Daycare" },
  { key: "preschool", label: "Preschool" },
  { key: "after_school", label: "Before / after-school care" },
  { key: "nanny", label: "Nanny or babysitter", hint: "Paid so you can work" },
  { key: "day_camp", label: "Day camps", hint: "Summer and school-break day camps" },
  { key: "overnight_camp", label: "Overnight camps", hint: "We'll tell you why these don't count" },
];
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function toProfile(d: Draft) {
  const parents = d.filingStatus === "mfj" ? d.parents : d.parents.slice(0, 1);
  return ProfileSchema.safeParse({ ...d, parents });
}

export function Onboarding() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved?.parents) return { ...initial, ...saved };
    } catch {}
    return initial;
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { track("quiz_start"); }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch {}
  }, [draft]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setParent = (i: number, patch: Partial<Draft["parents"][number]>) =>
    setDraft((d) => ({ ...d, parents: d.parents.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const parents = draft.filingStatus === "mfj" ? draft.parents : draft.parents.slice(0, 1);
  const hasBaby = draft.children.some((c) => c.birthYear >= 2025);

  const live = useMemo(() => {
    const p = toProfile(draft);
    return p.success ? analyzeBenefits(p.data) : null;
  }, [draft]);

  const steps = [
    {
      title: "Who files taxes in your home?",
      body: (
        <Choice
          label="Filing status"
          value={draft.filingStatus}
          onChange={(v) => set({ filingStatus: v })}
          options={[
            { value: "mfj", label: "Married, filing jointly", hint: "Two parents on one return" },
            { value: "hoh", label: "Single parent", hint: "Head of household" },
            { value: "single", label: "Single", hint: "Filing on your own" },
          ]}
        />
      ),
    },
    {
      title: "What does each parent earn in a year?",
      body: (
        <div className="space-y-5">
          {parents.map((p, i) => (
            <MoneyInput key={i} id={`pay-${i}`} label={i === 0 ? "Your yearly pay" : "Your partner's yearly pay"} hint="Before taxes, from your job" value={p.earnedIncome} onChange={(v) => setParent(i, { earnedIncome: v })} />
          ))}
        </div>
      ),
    },
    {
      title: "Tell us about your kids",
      body: (
        <div className="space-y-4">
          {draft.children.map((c, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1">
                <NumberInput id={`kid-${i}`} label={`Child ${i + 1}: birth year`} value={c.birthYear} min={2008} max={2026} onChange={(v) => set({ children: draft.children.map((x, j) => (j === i ? { ...x, birthYear: v } : x)) })} />
              </div>
              {draft.children.length > 1 && (
                <Button size="lg" variant="outline" onClick={() => set({ children: draft.children.filter((_, j) => j !== i) })} aria-label={`Remove child ${i + 1}`}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          {draft.children.length < 4 && (
            <Button variant="secondary" onClick={() => set({ children: [...draft.children, { name: "", birthYear: 2020 }] })}>
              Add a child
            </Button>
          )}
          {hasBaby && <YesNo label="Already elected the $1,000 Trump Account deposit?" value={draft.trumpAccountElected} onChange={(v) => set({ trumpAccountElected: v })} />}
        </div>
      ),
    },
    {
      title: "What do you spend on childcare in a year?",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          {CARE.map((c) => (
            <MoneyInput key={c.key} id={`care-${c.key}`} label={c.label} hint={c.hint} value={draft.childcare[c.key]} onChange={(v) => set({ childcare: { ...draft.childcare, [c.key]: v } })} />
          ))}
        </div>
      ),
    },
    {
      title: "What does each employer offer?",
      body: (
        <div className="space-y-6">
          {parents.map((p, i) => (
            <div key={i} className="panel space-y-4 p-5">
              <p className="font-semibold">{i === 0 ? "Your employer" : "Your partner's employer"}</p>
              <YesNo label="Offers a Dependent Care FSA" value={p.employerOffersDcfsa} onChange={(v) => setParent(i, { employerOffersDcfsa: v, currentElection: v ? p.currentElection : 0 })} />
              {p.employerOffersDcfsa && <MoneyInput id={`elect-${i}`} label="Amount elected this year" hint="Leave at $0 if you don't use it" value={p.currentElection} onChange={(v) => setParent(i, { currentElection: v })} />}
              <MoneyInput id={`backup-${i}`} label="Backup care benefit used" hint="Employer-paid backup childcare, if any" value={p.backupCare} onChange={(v) => setParent(i, { backupCare: v })} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "A few details that change the math",
      body: (
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold">State you live in</span>
            <select value={draft.state} onChange={(e) => set({ state: e.target.value })} className="field mt-2">
              {STATES.map((s) => (
                <option key={s} value={s}>{s}{STATE_RATES[s] === 0 ? " (no state income tax)" : ""}</option>
              ))}
            </select>
          </label>
          <YesNo label="Is any care paid to a relative?" value={draft.paysRelative} onChange={(v) => set({ paysRelative: v })} />
          <YesNo label="Does your FSA have a grace period into March?" value={draft.gracePeriod} onChange={(v) => set({ gracePeriod: v })} />
        </div>
      ),
    },
    {
      title: "How many paid days off does each parent get?",
      body: (
        <div className="space-y-5">
          {parents.map((p, i) => (
            <NumberInput key={i} id={`pto-${i}`} label={i === 0 ? "Your PTO days per year" : "Your partner's PTO days per year"} value={p.ptoDays} min={0} max={60} onChange={(v) => setParent(i, { ptoDays: v })} />
          ))}
          <p className="text-sm text-muted-foreground">We use this to plan school breaks later. It doesn&apos;t change your tax numbers.</p>
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  async function finish() {
    const p = toProfile(draft);
    if (!p.success) {
      setError("Some answers are missing. Check each step and try again.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await ensureSession();
      const res = await fetch("/api/household", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: p.data }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "We couldn't save your plan.");
      track("quiz_complete", { found_money: json.foundMoney });
      router.push("/reveal");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't save your plan.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
      <div className="sticky top-16 z-30 -mx-4 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</span>
          <span className="text-sm" aria-live="polite">
            Found so far <span className="marker font-heading text-xl font-extrabold tabular">{usd(live?.foundMoney ?? 0)}</span>
          </span>
        </div>
        <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }} aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-pine" : "bg-ink/10"}`} />
          ))}
        </div>
      </div>

      <section className="mt-8" aria-labelledby="step-title">
        <h1 id="step-title" className="text-[2rem] font-extrabold leading-[1.1] text-ink">{steps[step].title}</h1>
        <div className="mt-6">{steps[step].body}</div>
      </section>

      {error && <p role="alert" className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button size="lg" variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
            Back
          </Button>
        )}
        <Button
          size="lg" className="flex-1"
          disabled={saving}
          onClick={() => {
            track("quiz_step_answered", { step });
            if (last) void finish();
            else setStep(step + 1);
          }}
        >
          {last ? (saving ? "Building your plan…" : "See my plan") : "Continue"}
        </Button>
      </div>
    </div>
  );
}
