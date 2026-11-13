"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Flame, LineChart, Star, type LucideIcon } from "lucide-react";
import { appConfig } from "@/config/app.config";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

const icons: Record<string, LucideIcon> = { Sparkles, Flame, LineChart };
const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.5 } } as const;

function Cta({ label }: { label: string }) {
  return (
    <Button size="lg" className="tap h-14 rounded-full px-9 text-base font-semibold shadow-[0_0_40px_-8px_var(--primary)]" nativeButton={false} render={<Link href="/quiz" onClick={() => track("landing_cta")} />}>
      {label}
    </Button>
  );
}

export default function Home() {
  const { t, loc } = useI18n();
  const { landing, brand } = appConfig;

  useEffect(() => { track("landing_view"); }, []);

  return (
    <>
      <section className="relative mx-auto w-full max-w-5xl overflow-hidden px-4 pb-16 pt-14 sm:pt-24">
        <motion.div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[26rem] rounded-full bg-gradient-to-br from-primary/40 via-ember/20 to-transparent blur-3xl" animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative flex max-w-2xl flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-primary">
            <span aria-hidden>{brand.emoji}</span> {loc(brand.tagline)}
          </p>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] text-glow sm:text-6xl">{loc(landing.heroTitle)}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">{loc(landing.heroSub)}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Cta label={t("landing.ctaPrimary")} />
            <a href="#how" className="tap inline-flex items-center px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t("landing.ctaSecondary")}</a>
          </div>
        </motion.div>
      </section>

      <section aria-label={t("landing.proofTitle")} className="border-y border-white/5 bg-white/[0.02]">
        <dl className="mx-auto grid max-w-5xl grid-cols-3 gap-2 px-4 py-6 text-center">
          {landing.proof.stats.map((s) => (
            <div key={s.value}>
              <dt className="sr-only">{loc(s.label)}</dt>
              <dd className="font-heading text-2xl font-extrabold text-primary sm:text-3xl">{s.value}</dd>
              <p className="mt-1 text-xs text-muted-foreground" aria-hidden>{loc(s.label)}</p>
            </div>
          ))}
        </dl>
      </section>

      <section id="how" className="mx-auto w-full max-w-5xl px-4 py-16">
        <motion.h2 {...fade} className="text-2xl font-extrabold sm:text-3xl">{t("landing.howTitle")}</motion.h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {landing.steps.map((s, i) => (
            <motion.li key={loc(s.title)} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass relative rounded-3xl p-6">
              <span className="font-heading text-5xl font-extrabold text-primary/25" aria-hidden>{i + 1}</span>
              <h3 className="mt-2 text-lg font-bold">{loc(s.title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{loc(s.body)}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <motion.h2 {...fade} className="text-2xl font-extrabold sm:text-3xl">{t("landing.valueTitle")}</motion.h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {landing.values.map((v, i) => {
            const Icon = icons[v.icon] ?? Sparkles;
            return (
              <motion.li key={loc(v.title)} {...fade} transition={{ duration: 0.5, delay: i * 0.1 }} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-4 text-lg font-bold">{loc(v.title)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{loc(v.body)}</p>
              </motion.li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <motion.h2 {...fade} className="text-2xl font-extrabold sm:text-3xl">{t("landing.proofTitle")}</motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {landing.proof.reviews.map((r) => (
            <motion.figure key={r.name} {...fade} className="glass rounded-3xl p-6">
              <div className="flex gap-0.5 text-primary" role="img" aria-label="5/5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-current" aria-hidden />)}</div>
              <blockquote className="mt-3 text-base">“{loc(r.text)}”</blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">{r.name} · {loc(r.role)}</figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <motion.div {...fade} className="rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/15 via-transparent to-mint/10 p-8 text-center sm:p-14">
          <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">{t("landing.finalCta")}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t("landing.finalCtaSub")}</p>
          <div className="mt-6"><Cta label={t("landing.ctaPrimary")} /></div>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.name} · {t("footer.rights")} · {t("footer.demo")}
      </footer>
    </>
  );
}
