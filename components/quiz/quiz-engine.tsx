"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { quizConfig, type QuizStep } from "@/config/quiz.config";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { getSessionId } from "@/lib/session";
import { ensureGuest } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { StepBody } from "./steps";
import { BuildingLoader } from "./building-loader";

type Answers = Record<string, string | string[] | number | boolean | undefined>;
const KEY = "bc_quiz";
const steps = quizConfig.steps;

function load(): { idx: number; answers: Answers } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (raw && typeof raw.idx === "number") return { idx: Math.min(raw.idx, steps.length - 1), answers: raw.answers ?? {} };
  } catch {}
  return { idx: 0, answers: {} };
}

function isValid(step: QuizStep, v: Answers[string]): boolean {
  switch (step.type) {
    case "single": return Boolean(v);
    case "multi": return Array.isArray(v) && v.length > 0;
    case "text": return step.optional || (typeof v === "string" && v.trim().length > 0);
    default: return true; // slider, photo, info
  }
}

export default function QuizEngine() {
  const { t, loc } = useI18n();
  const router = useRouter();
  const [init] = useState(load);
  const [idx, setIdx] = useState(init.idx);
  const [answers, setAnswers] = useState<Answers>(init.answers);
  const [photo, setPhoto] = useState<string | undefined>();
  const [dir, setDir] = useState(1);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[idx];
  const interactive = steps.filter((s) => s.type !== "loader");
  const progress = step.type === "loader" ? 100 : Math.round((idx / interactive.length) * 100);

  useEffect(() => { void ensureGuest(); }, []);

  useEffect(() => {
    track("quiz_step_view", { step: step.id, index: idx });
    try { localStorage.setItem(KEY, JSON.stringify({ idx, answers })); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const persist = useCallback((a: Answers, completed = false) => {
    void fetch("/api/quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), answers: a, completed }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const go = useCallback((next: number, a: Answers) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDir(next > idx ? 1 : -1);
    setIdx(next);
    try { localStorage.setItem(KEY, JSON.stringify({ idx: next, answers: a })); } catch {}
  }, [idx]);

  const advance = useCallback((a: Answers) => {
    track("quiz_step_answer", { step: step.id });
    persist(a, steps[idx + 1]?.type === "loader");
    if (steps[idx + 1]?.type === "loader") track("quiz_complete");
    go(idx + 1, a);
  }, [go, idx, persist, step.id]);

  const onChange = (v: Answers[string], auto = false) => {
    const next = { ...answers, [step.id]: v };
    setAnswers(next);
    if (auto) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => advance(next), 280);
    }
  };

  const valid = isValid(step, answers[step.id]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-6 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => idx > 0 && step.type !== "loader" && go(idx - 1, answers)}
          disabled={idx === 0 || step.type === "loader"}
          aria-label={t("common.back")}
          className="tap flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-0"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`${t("quiz.step")} ${Math.min(idx + 1, interactive.length)} ${t("quiz.of")} ${interactive.length}`}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {Math.min(idx + 1, interactive.length)}/{interactive.length}
        </span>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.section
          key={step.id}
          custom={dir}
          initial={{ opacity: 0, x: 40 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 * dir }}
          transition={{ duration: 0.25 }}
          className="flex flex-1 flex-col"
        >
          {step.type === "loader" ? (
            <BuildingLoader step={step} answers={answers} photo={photo} onDone={() => { try { localStorage.removeItem(KEY); } catch {} router.push("/result"); }} />
          ) : (
            <>
              <h1 className="text-balance text-2xl font-bold leading-tight sm:text-3xl">{loc(step.title)}</h1>
              {step.subtitle && <p className="mt-2 text-muted-foreground">{loc(step.subtitle)}</p>}
              <div className="mt-6 flex-1">
                <StepBody step={step} value={answers[step.id]} onChange={onChange} photo={photo} onPhoto={setPhoto} />
              </div>
              <Button
                size="lg"
                disabled={!valid}
                onClick={() => advance(answers)}
                className="tap mt-6 h-12 w-full rounded-full text-base font-semibold"
              >
                {step.type === "info" ? t("common.continue") : (step.type === "text" || step.type === "photo") && !answers[step.id] ? t("common.skip") : t("common.next")}
              </Button>
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
