"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { pricing, type PlanId } from "@/config/site";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Checkout({ hasHousehold, foundMoney }: { hasHousehold: boolean; foundMoney: number | null }) {
  const router = useRouter();
  const [planId, setPlanId] = useState<PlanId>("annual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = pricing.plans.find((p) => p.id === planId)!;
  const yearlyCost = plan.period === "year" ? plan.price : plan.price * 12;

  async function start() {
    if (!hasHousehold) return router.push("/start");
    setBusy(true);
    setError(null);
    track("checkout_start", { plan: planId });
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push("/app");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't start your plan.");
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5 sm:p-6">
      <div role="radiogroup" aria-label="Plan" className="space-y-2.5">
        {pricing.plans.map((p) => {
          const on = p.id === planId;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => { setPlanId(p.id); track("plan_selected", { plan: p.id }); }}
              className={cn(
                "flex w-full items-center gap-4 rounded-[14px] border px-4 py-4 text-left transition-[border-color,background-color,box-shadow]",
                on ? "border-pine bg-[#f1f7f5] shadow-[0_0_0_1px_var(--pine)]" : "border-ink/12 bg-white hover:border-pine/45",
              )}
            >
              <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-pine bg-pine text-white" : "border-ink/20")}>
                {on && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{p.name}</span>
                  {p.highlight && <span className="rounded-full bg-marigold/90 px-2 py-0.5 text-[11px] font-bold text-ink">Save 31%</span>}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{p.note} · ${p.perDay.toFixed(2)} a day</span>
              </span>
              <span className="text-right">
                <span className="font-heading text-2xl font-extrabold text-ink tabular">${p.price}</span>
                <span className="block text-xs text-muted-foreground">per {p.period}</span>
              </span>
            </button>
          );
        })}
      </div>

      {foundMoney !== null && foundMoney > 0 && (
        <p className="mt-5 text-[15px] text-ink">
          Genora found your family <span className="marker font-semibold tabular">${foundMoney.toLocaleString("en-US")}</span> this year,{" "}
          {Math.max(1, Math.round(foundMoney / yearlyCost))}× what the {plan.name.toLowerCase()} plan costs.
        </p>
      )}

      {error && <p role="alert" className="mt-4 rounded-[10px] bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Button size="lg" className="mt-5 w-full" disabled={busy} onClick={start}>
        {hasHousehold ? (busy ? "Starting your plan…" : `Start the ${plan.name.toLowerCase()} plan`) : "Find my money first"}
      </Button>

      <div className="inset mt-5 flex gap-3 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-pine" aria-hidden />
        <div>
          <p className="font-semibold text-ink">10× guarantee</p>
          <p className="mt-0.5 text-muted-foreground">{pricing.guarantee}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">{pricing.mockNotice}</p>
    </div>
  );
}
