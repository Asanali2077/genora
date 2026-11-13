"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Bell, MessageCircle, TrendingUp, Lock, Share2, Check, AlertTriangle, type LucideIcon } from "lucide-react";
import type { AnalyzeResult } from "@/config/prompts/analyze";
import { paywallConfig } from "@/config/paywall.config";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = { CalendarCheck, Bell, MessageCircle, TrendingUp };

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto size-44" role="img" aria-label={`${label}: ${score}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="oklch(1 0 0 / 0.1)" strokeWidth="9" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 8px var(--primary))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-5xl font-extrabold text-glow">{score}</span>
        <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function ResultView({ result, premium, shareId, readonly = false }: { result: AnalyzeResult; premium: boolean; shareId?: string; readonly?: boolean }) {
  const { t, loc } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    if (!shareId) return;
    const url = `${window.location.origin}/r/${shareId}`;
    track("share_click");
    try {
      if (navigator.share) await navigator.share({ title: t("result.title"), url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">{t("result.title")}</p>
        <h1 className="mt-3 text-balance text-2xl font-extrabold leading-tight">{result.headline}</h1>
        <p className="mt-3 text-muted-foreground">{result.summary}</p>
      </motion.header>

      <div className="mt-8"><ScoreRing score={result.score} label={t("result.score")} /></div>

      <section className="mt-8 grid gap-3">
        <div className="glass rounded-2xl p-4">
          <ul className="space-y-2">
            {result.strengths.map((s) => (
              <li key={s} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden />{s}</li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-4">
          <ul className="space-y-2">
            {result.risks.map((s) => (
              <li key={s} className="flex gap-2 text-sm text-foreground/80"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden />{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8" aria-label={t("result.title")}>
        <ol className="relative space-y-3 border-l border-white/10 pl-5">
          {result.plan.map((d, i) => {
            const locked = d.premium && !premium;
            return (
              <motion.li key={d.day} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="relative">
                <span className={cn("absolute -left-[27px] top-4 size-3 rounded-full ring-4 ring-background", locked ? "bg-white/20" : "bg-primary")} aria-hidden />
                <div className={cn("glass rounded-2xl p-4", locked && "relative overflow-hidden")}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-heading text-sm font-bold">{d.title}</h2>
                    <span className="text-xs tabular-nums text-muted-foreground">#{d.day} · {d.minutes}′</span>
                  </div>
                  <p className={cn("mt-1 text-sm text-foreground/85", locked && "select-none blur-[5px]")} aria-hidden={locked}>{d.action}</p>
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/30 text-xs font-medium text-primary">
                      <Lock className="size-3.5" aria-hidden />{t("result.locked")}
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      {!premium && (
        <section className="mt-10 rounded-3xl border border-primary/30 bg-primary/[0.06] p-5">
          <h2 className="font-heading text-lg font-bold">{t("result.premiumTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{result.premiumTeaser}</p>
          <ul className="mt-4 space-y-3">
            {paywallConfig.premiumFeatures.map((f) => {
              const Icon = icons[f.icon] ?? CalendarCheck;
              return (
                <li key={loc(f.title)} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="size-4" aria-hidden /></span>
                  <div><p className="text-sm font-semibold">{loc(f.title)}</p><p className="text-xs text-muted-foreground">{loc(f.body)}</p></div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/85 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md gap-3">
          {!readonly && shareId && (
            <Button variant="outline" size="lg" className="tap h-12 rounded-full" onClick={share} aria-label={t("result.shareTitle")}>
              {copied ? <Check className="size-5" /> : <Share2 className="size-5" />}
              {copied && <span className="ml-1 text-xs">{t("common.copied")}</span>}
            </Button>
          )}
          {premium && !readonly ? null : (
            <Button size="lg" className="tap h-12 flex-1 rounded-full text-base font-semibold" nativeButton={false} render={<Link href={readonly ? "/quiz" : "/paywall"} onClick={() => track("paywall_click")} />}>
              {readonly ? t("landing.ctaPrimary") : t("result.unlock")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
