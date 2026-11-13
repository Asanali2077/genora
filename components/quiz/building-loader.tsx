"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { QuizStep } from "@/config/quiz.config";
import { useI18n } from "@/lib/i18n";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

const MIN_MS = 4200;

export function BuildingLoader({ step, answers, photo, onDone }: { step: Extract<QuizStep, { type: "loader" }>; answers: Record<string, unknown>; photo?: string; onDone: () => void }) {
  const { t, loc, locale } = useI18n();
  const [msg, setMsg] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    const iv = setInterval(() => setMsg((m) => Math.min(m + 1, step.messages.length - 1)), MIN_MS / step.messages.length);
    return () => clearInterval(iv);
  }, [step.messages.length]);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    const t0 = Date.now();
    (async () => {
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: getSessionId(), locale, answers, photo }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        localStorage.setItem("bc_result", JSON.stringify(data));
        await new Promise((r) => setTimeout(r, Math.max(0, MIN_MS - (Date.now() - t0))));
        track("result_ready", { provider: data.provider });
        onDone();
      } catch {
        setFailed(true);
      }
    })();
  }, [attempt, answers, photo, locale, onDone]);

  if (failed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">{t("common.errorTitle")}</h1>
        <p className="text-muted-foreground">{t("common.errorBody")}</p>
        <Button className="tap rounded-full px-8" onClick={() => { setFailed(false); setAttempt((a) => a + 1); }}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center" aria-live="polite">
      <div className="relative size-36">
        <motion.div className="absolute inset-0 rounded-full border-2 border-primary/30" animate={{ scale: [1, 1.35], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <motion.div className="absolute inset-0 rounded-full border-2 border-mint/30" animate={{ scale: [1, 1.7], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }} />
        <motion.div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-ember shadow-[0_0_60px_var(--primary)]" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{loc(step.title)}</h1>
        <motion.p key={msg} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-muted-foreground">
          {loc(step.messages[msg])}
        </motion.p>
      </div>
    </div>
  );
}
