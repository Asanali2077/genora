"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MoneyInput({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-[13px] text-muted-foreground">{hint}</span>}
      <span className="field mt-2 flex items-center">
        <span className="text-muted-foreground" aria-hidden>$</span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? value.toLocaleString("en-US") : ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          className="tabular h-full w-full bg-transparent pl-1 outline-none"
        />
      </span>
    </label>
  );
}

export function NumberInput({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        className="field tabular mt-2"
      />
    </label>
  );
}

function Indicator({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        on ? "border-brand bg-brand text-white" : "border-ink/20 bg-white",
      )}
    >
      {on && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  );
}

export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <div role="radiogroup" className="mt-3 grid gap-2.5">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn(
                "tap flex items-center justify-between gap-4 rounded-[14px] border bg-white px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow]",
                on ? "border-brand bg-wash shadow-[0_0_0_1px_var(--brand)]" : "border-ink/12 hover:border-brand/45",
              )}
            >
              <span>
                <span className="block font-semibold text-ink">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-sm text-muted-foreground">{o.hint}</span>}
              </span>
              <Indicator on={on} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span id={`yn-${label}`} className="text-sm font-semibold text-ink">{label}</span>
      <div role="radiogroup" aria-labelledby={`yn-${label}`} className="inline-flex shrink-0 rounded-[11px] bg-wash p-1">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "h-9 min-w-14 rounded-[8px] px-3 text-sm font-semibold transition-[background-color,color,box-shadow]",
              value === v ? "bg-white text-brand shadow-[0_1px_2px_rgba(23,22,31,0.12)]" : "text-muted-foreground hover:text-ink",
            )}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
