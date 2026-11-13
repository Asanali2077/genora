"use client";

import Link from "next/link";
import { appConfig } from "@/config/app.config";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

// Временная заглушка T1; полноценный лендинг — T9.
export default function Home() {
  const { t, loc } = useI18n();
  const { landing } = appConfig;
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">{loc(appConfig.brand.tagline)}</p>
      <h1 className="text-balance text-4xl font-extrabold leading-[1.05] sm:text-6xl text-glow">{loc(landing.heroTitle)}</h1>
      <p className="max-w-xl text-lg text-muted-foreground">{loc(landing.heroSub)}</p>
      <div>
        <Button size="lg" className="tap rounded-full px-8 text-base" render={<Link href="/quiz" />}>
          {t("landing.ctaPrimary")}
        </Button>
      </div>
    </section>
  );
}
