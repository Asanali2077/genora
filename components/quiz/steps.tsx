"use client";

import { useRef } from "react";
import { Camera, Check } from "lucide-react";
import type { QuizStep } from "@/config/quiz.config";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Value = string | string[] | number | boolean | undefined;
type Props = { step: QuizStep; value: Value; onChange: (v: Value, autoAdvance?: boolean) => void; photo?: string; onPhoto: (dataUrl?: string) => void };

/** Сжимаем фото до 1024px JPEG, чтобы не раздувать запрос. */
async function toDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

export function StepBody({ step, value, onChange, photo, onPhoto }: Props) {
  const { t, loc } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  if (step.type === "single" || step.type === "multi") {
    const multi = step.type === "multi";
    const selected = multi ? ((value as string[] | undefined) ?? []) : value ? [value as string] : [];
    return (
      <div role={multi ? "group" : "radiogroup"} aria-label={loc(step.title)} className="grid gap-3">
        {step.options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => {
                if (!multi) return onChange(o.id, true);
                const max = step.type === "multi" ? step.max : undefined;
                const next = on ? selected.filter((x) => x !== o.id) : max && selected.length >= max ? selected : [...selected, o.id];
                onChange(next);
              }}
              className={cn(
                "tap glass group flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-base transition-all active:scale-[0.98]",
                on ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]" : "hover:border-white/25 hover:bg-white/[0.07]",
              )}
            >
              {o.emoji && <span className="text-2xl" aria-hidden>{o.emoji}</span>}
              <span className="flex-1 font-medium">{loc(o.label)}</span>
              <span className={cn("flex size-6 items-center justify-center rounded-full border transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-white/20")} aria-hidden>
                {on && <Check className="size-4" />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === "slider") {
    const v = typeof value === "number" ? value : step.initial;
    const pct = ((v - step.min) / (step.max - step.min)) * 100;
    return (
      <div className="glass rounded-3xl p-6">
        <p className="text-center font-heading text-5xl font-extrabold text-primary text-glow" aria-live="polite">
          {v}
          {step.unit && <span className="ml-2 text-xl text-muted-foreground">{loc(step.unit)}</span>}
        </p>
        <input
          type="range"
          min={step.min}
          max={step.max}
          step={step.step}
          value={v}
          aria-label={loc(step.title)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-8 h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--primary)]"
          style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, oklch(1 0 0 / 0.12) ${pct}%)` }}
        />
        {step.labels && (
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{loc(step.labels.min)}</span>
            <span>{loc(step.labels.max)}</span>
          </div>
        )}
      </div>
    );
  }

  if (step.type === "text") {
    return (
      <textarea
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={loc(step.placeholder)}
        aria-label={loc(step.title)}
        rows={5}
        maxLength={600}
        className="glass w-full resize-none rounded-2xl p-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    );
  }

  if (step.type === "photo") {
    return (
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              onPhoto(await toDataUrl(f));
              onChange(true);
            } catch {
              onPhoto(undefined);
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="glass flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="size-full object-cover" />
          ) : (
            <>
              <Camera className="size-10 text-primary" aria-hidden />
              <span>{t("quiz.uploadHint")}</span>
              <span className="text-xs">{t("quiz.uploadOptional")}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (step.type === "info") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        {step.emoji && <div className="mb-4 text-5xl" aria-hidden>{step.emoji}</div>}
        <p className="text-lg leading-relaxed text-foreground/90">{loc(step.body)}</p>
      </div>
    );
  }
  return null;
}
