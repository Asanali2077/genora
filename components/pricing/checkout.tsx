"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div>
      <div role="radiogroup" aria-label="Plan" className="grid gap-3 sm:grid-cols-2">
        {pricing.plans.map((p) => {
          const on = p.id === planId;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => { setPlanId(p.id); track("plan_selected", { plan: p.id }); }}
              className={cn("tap relative rounded-xl border-2 bg-card p-5 text-left transition-colors", on ? "border-pine" : "border-border hover:border-pine/40")}
            >
              <span className="flex items-baseline justify-between">
                <span className="text-lg font-bold">{p.name}</span>
                {p.highlight && <span className="rounded-full bg-marigold px-2.5 py-0.5 text-xs font-bold text-ink">Best value</span>}
              </span>
              <span className="mt-3 block font-heading text-4xl font-extrabold tabular">${p.price}<span className="text-base font-medium text-muted-foreground"> / {p.period}</span></span>
              <span className="mt-1 block text-sm text-muted-foreground">${p.perDay.toFixed(2)} a day · {p.note}</span>
            </button>
          );
        })}
      </div>

      {foundMoney !== null && foundMoney > 0 && (
        <p className="mt-5 text-sm">
          Genora found you <strong className="tabular">${foundMoney.toLocaleString("en-US")}</strong> this year — {Math.max(1, Math.round(foundMoney / (plan.period === "year" ? plan.price : plan.price * 12)))}× the price of the {plan.name.toLowerCase()} plan.
        </p>
      )}

      {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Button size="lg" className="tap mt-6 h-13 w-full text-base sm:w-auto sm:px-10" disabled={busy} onClick={start}>
        {hasHousehold ? (busy ? "Starting your plan…" : `Start ${plan.name.toLowerCase()} plan`) : "Build my plan first"}
      </Button>
      <p className="mt-3 text-sm text-muted-foreground">{pricing.guarantee}</p>
      <p className="mt-1 text-xs text-muted-foreground">{pricing.mockNotice}</p>
    </div>
  );
}
