"use client";

import { LOCALES } from "@/config/app.config";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t("nav.language")} className="glass flex rounded-full p-0.5 text-xs font-medium">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "tap rounded-full px-3 uppercase tracking-wider transition-colors",
            locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
