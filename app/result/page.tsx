"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnalyzeResultSchema, type AnalyzeResult } from "@/config/prompts/analyze";
import { useI18n } from "@/lib/i18n";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics";
import { ResultView } from "@/components/result/result-view";
import { Button } from "@/components/ui/button";

type State = { status: "loading" } | { status: "empty" } | { status: "ready"; result: AnalyzeResult; shareId?: string; premium: boolean };

export default function ResultPage() {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = JSON.parse(localStorage.getItem("bc_result") ?? "null");
        const result = AnalyzeResultSchema.parse(saved?.result);
        const premium = await fetch(`/api/premium?sessionId=${getSessionId()}`).then((r) => r.json()).then((j) => Boolean(j.premium)).catch(() => false);
        if (!cancelled) { setState({ status: "ready", result, shareId: saved.shareId, premium }); track("result_view"); }
      } catch {
        if (!cancelled) setState({ status: "empty" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.status === "loading") return <div className="flex flex-1 items-center justify-center text-muted-foreground" role="status">{t("common.loading")}</div>;
  if (state.status === "empty")
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">{t("result.notFound")}</h1>
        <Button className="tap rounded-full px-8" nativeButton={false} render={<Link href="/quiz" />}>{t("landing.ctaPrimary")}</Button>
      </div>
    );
  return <ResultView result={state.result} premium={state.premium} shareId={state.shareId} />;
}
