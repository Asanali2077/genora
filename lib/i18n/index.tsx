"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ru, type Copy } from "@/config/copy/ru";
import { en } from "@/config/copy/en";
import type { Locale, Localized } from "@/config/app.config";

const dictionaries: Record<Locale, Copy> = { ru, en };

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** t("common.next") — ключ по точечному пути. */
  t: (key: string) => string;
  /** loc({ru, en}) — выбор локализованной строки из конфига. */
  loc: (value: Localized) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

function lookup(dict: Copy, key: string): string {
  const found = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dict);
  return typeof found === "string" ? found : key;
}

export function LocaleProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      t: (key) => lookup(dictionaries[locale], key),
      loc: (v) => v[locale],
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used inside <LocaleProvider>");
  return ctx;
}
