"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">{t("common.errorTitle")}</h1>
      <p className="text-muted-foreground">{t("common.errorBody")}</p>
      <Button className="tap rounded-full px-8" onClick={reset}>{t("common.retry")}</Button>
    </div>
  );
}
