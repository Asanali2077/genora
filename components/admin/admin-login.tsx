"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function AdminLogin() {
  const { t } = useI18n();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) router.refresh();
    else setError(true);
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
      <label className="grid gap-2 text-sm text-muted-foreground">
        {t("admin.password")}
        <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError(false); }} autoFocus className="glass h-12 rounded-xl px-4 text-base text-foreground outline-none focus:border-primary" />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{t("admin.wrongPassword")}</p>}
      <Button type="submit" size="lg" className="tap h-12 rounded-full">{t("admin.login")}</Button>
    </form>
  );
}
