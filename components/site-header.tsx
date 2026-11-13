"use client";

import Link from "next/link";
import { appConfig } from "@/config/app.config";
import { useI18n } from "@/lib/i18n";
import { LocaleSwitcher } from "./locale-switcher";

export function SiteHeader() {
  const { loc } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
          <span className="text-primary text-glow" aria-hidden>{appConfig.brand.emoji}</span>
          {appConfig.brand.name}
          <span className="sr-only">— {loc(appConfig.brand.tagline)}</span>
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
