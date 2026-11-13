"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-6xl font-extrabold text-primary text-glow">404</p>
      <h1 className="text-xl font-bold">{t("result.notFound")}</h1>
      <Button className="tap rounded-full px-8" nativeButton={false} render={<Link href="/" />}>{t("landing.ctaPrimary")}</Button>
    </div>
  );
}
