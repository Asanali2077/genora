"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarCheck, Bell, MessageCircle, TrendingUp, ShieldCheck, Check, type LucideIcon } from "lucide-react";
import { paywallConfig } from "@/config/paywall.config";
import { appConfig } from "@/config/app.config";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { getSessionId, getVariant } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = { CalendarCheck, Bell, MessageCircle, TrendingUp };
const TIMER_KEY = "bc_offer_end";

function useCountdown(minutes: number, enabled: boolean) {
  const [end] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(TIMER_KEY));
      if (saved > Date.now()) return saved;
      const e = Date.now() + minutes * 60000;
      localStorage.setItem(TIMER_KEY, String(e));
      return e;
    } catch {
      return Date.now() + minutes * 60000;
    }
  });
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));
  useEffect(() => {
    if (!enabled) return;
    const iv = setInterval(() => setLeft(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(iv);
  }, [end, enabled]);
  const s = Math.floor(left / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function PaywallView() {
  const { t, loc } = useI18n();
  const router = useRouter();
  const [variant] = useState(getVariant);
  const v = paywallConfig.variants[variant];
  const [planId, setPlanId] = useState(v.defaultPlan);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const time = useCountdown(paywallConfig.offerTimerMinutes, v.showTimer);
  const plan = paywallConfig.plans.find((p) => p.id === planId)!;
  const period = { week: t("paywall.perWeek"), month: t("paywall.perMonth"), year: t("paywall.perYear") };

  useEffect(() => { track("paywall_view", { variant }); }, [variant]);

  async function buy() {
    setBusy(true);
    setError(false);
    track("checkout_start", { plan: plan.id });
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: getSessionId(), planId: plan.id, variant }) });
      if (!res.ok) throw new Error();
      setDone(true);
      setTimeout(() => router.push("/result"), 1600);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center" role="status">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_60px_var(--primary)]">
          <Check className="size-10" />
        </motion.div>
        <h1 className="text-2xl font-bold">{t("paywall.success")}</h1>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-6">
      {v.showTimer && (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-full border border-ember/40 bg-ember/10 py-2 text-sm text-ember" role="timer">
          {t("paywall.offerEnds")} <span className="font-heading font-bold tabular-nums">{time}</span>
        </div>
      )}
      <h1 className="text-balance text-center text-3xl font-extrabold leading-tight text-glow">{loc(v.headline)}</h1>
      <p className="mt-3 text-center text-muted-foreground">{loc(v.subline)}</p>

      <ul className="mt-6 grid gap-2.5">
        {paywallConfig.premiumFeatures.map((f) => {
          const Icon = icons[f.icon] ?? CalendarCheck;
          return (
            <li key={loc(f.title)} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><Icon className="size-4" aria-hidden /></span>
              <span className="font-medium">{loc(f.title)}</span>
            </li>
          );
        })}
      </ul>

      <div role="radiogroup" aria-label={t("nav.pricing")} className="mt-7 grid gap-3">
        {paywallConfig.plans.map((p) => {
          const on = p.id === planId;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => { setPlanId(p.id); track("plan_select", { plan: p.id }); }}
              className={cn("tap glass relative flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-all", on ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]" : "hover:border-white/25")}
            >
              {p.highlight && <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{t("paywall.bestValue")}</span>}
              <div>
                <p className="font-semibold">{loc(p.name)}</p>
                {p.trialDays > 0 && <p className="text-xs text-mint">{p.trialDays} {t("paywall.trial")}</p>}
              </div>
              <p className="text-right"><span className="font-heading text-lg font-bold">{appConfig.econ.currency}{p.price}</span> <span className="text-xs text-muted-foreground">{period[p.period]}</span></p>
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" aria-hidden />{t("paywall.guarantee")}</p>
      <p className="mt-1 text-center text-[11px] text-muted-foreground/70">{t("paywall.mockNotice")}</p>
      {error && <p role="alert" className="mt-3 text-center text-sm text-destructive">{t("common.errorBody")}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/85 p-4 backdrop-blur-xl">
        <Button size="lg" disabled={busy} onClick={buy} className="tap mx-auto flex h-13 w-full max-w-md rounded-full text-base font-semibold">
          {busy ? t("common.loading") : loc(v.cta)}
        </Button>
      </div>
    </div>
  );
}
